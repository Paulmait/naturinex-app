import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SMS from 'expo-sms';
import CryptoJS from 'crypto-js';
import { supabase } from '../config/supabase';
import { auth as firebaseAuth, db as firebaseDb } from '../config/firebase.web';
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  linkWithCredential,
} from 'firebase/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
class TwoFactorAuthService {
  constructor() {
    this.USE_SUPABASE = process.env.REACT_APP_USE_SUPABASE === 'true';
    this.encryptionKey = 'naturinex-2fa-encryption-key';
    this.totpSecrets = new Map();
    this.backupCodes = new Map();
    this.biometricEnabled = false;
    this.sessionValidation = new Map();
  }
  // ==================== INITIALIZATION ====================
  async initialize() {
    try {
      // Check biometric availability
      const biometricTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      this.biometricEnabled = biometricTypes.length > 0;
      // Load stored 2FA settings
      await this.loadUserSettings();
      return {
        biometricAvailable: this.biometricEnabled,
        biometricTypes,
        initialized: true,
      };
    } catch (error) {
      console.error('TwoFactorAuthService initialization error:', error);
      throw error;
    }
  }
  // ==================== PHONE SMS VERIFICATION ====================
  async setupPhoneVerification(phoneNumber, userId) {
    try {
      if (this.USE_SUPABASE) {
        return await this.setupPhoneVerificationSupabase(phoneNumber, userId);
      } else {
        return await this.setupPhoneVerificationFirebase(phoneNumber, userId);
      }
    } catch (error) {
      console.error('Phone verification setup error:', error);
      throw error;
    }
  }
  async setupPhoneVerificationSupabase(phoneNumber, userId) {
    // Generate verification code
    const verificationCode = this.generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    // Store verification code in database
    const { error } = await supabase.from('phone_verifications').upsert({
      user_id: userId,
      phone_number: phoneNumber,
      verification_code: verificationCode,
      expires_at: expiresAt.toISOString(),
      verified: false,
    });
    if (error) throw error;
    // Send SMS (using Supabase Edge Function)
    await this.sendSMSCode(phoneNumber, verificationCode);
    return {
      success: true,
      phoneNumber,
      expiresAt: expiresAt.toISOString(),
    };
  }
  async setupPhoneVerificationFirebase(phoneNumber, userId) {
    // Setup reCAPTCHA verifier
    const recaptchaVerifier = new RecaptchaVerifier(firebaseAuth, 'recaptcha-container', {
      size: 'invisible',
      callback: () => {
      },
    });
    try {
      const confirmationResult = await signInWithPhoneNumber(
        firebaseAuth,
        phoneNumber,
        recaptchaVerifier,
      );
      // Store confirmation result for verification
      await SecureStore.setItemAsync(
        `phone_confirmation_${userId}`,
        JSON.stringify({
          verificationId: confirmationResult.verificationId,
          phoneNumber,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        }),
      );
      return {
        success: true,
        verificationId: confirmationResult.verificationId,
        phoneNumber,
      };
    } catch (error) {
      recaptchaVerifier.clear();
      throw error;
    }
  }
  async verifyPhoneCode(userId, code) {
    try {
      if (this.USE_SUPABASE) {
        return await this.verifyPhoneCodeSupabase(userId, code);
      } else {
        return await this.verifyPhoneCodeFirebase(userId, code);
      }
    } catch (error) {
      console.error('Phone code verification error:', error);
      throw error;
    }
  }
  async verifyPhoneCodeSupabase(userId, code) {
    const { data, error } = await supabase
      .from('phone_verifications')
      .select('*')
      .eq('user_id', userId)
      .eq('verification_code', code)
      .eq('verified', false)
      .single();
    if (error || !data) {
      throw new Error('Invalid verification code');
    }
    // Check if code is expired
    if (new Date() > new Date(data.expires_at)) {
      throw new Error('Verification code expired');
    }
    // Mark as verified
    await supabase.from('phone_verifications').update({ verified: true }).eq('id', data.id);
    // Enable phone 2FA for user
    await this.enablePhone2FA(userId, data.phone_number);
    return {
      success: true,
      phoneNumber: data.phone_number,
    };
  }
  async verifyPhoneCodeFirebase(userId, code) {
    const confirmationData = await SecureStore.getItemAsync(`phone_confirmation_${userId}`);
    if (!confirmationData) {
      throw new Error('No phone verification in progress');
    }
    const { verificationId, phoneNumber } = JSON.parse(confirmationData);
    const credential = PhoneAuthProvider.credential(verificationId, code);
    // Link phone number to user account
    const user = firebaseAuth.currentUser;
    if (user) {
      await linkWithCredential(user, credential);
    }
    // Enable phone 2FA
    await this.enablePhone2FA(userId, phoneNumber);
    // Clean up stored confirmation
    await SecureStore.deleteItemAsync(`phone_confirmation_${userId}`);
    return {
      success: true,
      phoneNumber,
    };
  }
  async enablePhone2FA(userId, phoneNumber) {
    const settings = {
      phone_2fa_enabled: true,
      phone_number: phoneNumber,
      updated_at: new Date().toISOString(),
    };
    if (this.USE_SUPABASE) {
      await supabase.from('user_2fa_settings').upsert({ user_id: userId, ...settings });
    } else {
      await updateDoc(doc(firebaseDb, 'user_2fa_settings', userId), settings);
    }
  }
  // ==================== TOTP AUTHENTICATOR APPS ====================
  async setupTOTP(userId, appName = 'NaturineX') {
    try {
      const secret = this.generateTOTPSecret();
      const qrCodeData = this.generateQRCodeData(userId, secret, appName);
      // Store encrypted secret
      const encryptedSecret = this.encryptData(secret);
      await SecureStore.setItemAsync(`totp_secret_${userId}`, encryptedSecret);
      // Save to database (encrypted)
      const settings = {
        totp_enabled: false, // Will be enabled after verification
        totp_secret_encrypted: encryptedSecret,
        updated_at: new Date().toISOString(),
      };
      if (this.USE_SUPABASE) {
        await supabase.from('user_2fa_settings').upsert({ user_id: userId, ...settings });
      } else {
        await updateDoc(doc(firebaseDb, 'user_2fa_settings', userId), settings);
      }
      return {
        secret,
        qrCodeData,
        manualEntryKey: secret,
      };
    } catch (error) {
      console.error('TOTP setup error:', error);
      throw error;
    }
  }
  async verifyTOTP(userId, token) {
    try {
      const encryptedSecret = await SecureStore.getItemAsync(`totp_secret_${userId}`);
      if (!encryptedSecret) {
        throw new Error('TOTP not set up');
      }
      const secret = this.decryptData(encryptedSecret);
      const isValid = this.verifyTOTPToken(secret, token);
      if (isValid) {
        // Enable TOTP 2FA
        await this.enableTOTP2FA(userId);
        return { success: true };
      } else {
        throw new Error('Invalid TOTP token');
      }
    } catch (error) {
      console.error('TOTP verification error:', error);
      throw error;
    }
  }
  async enableTOTP2FA(userId) {
    const settings = {
      totp_enabled: true,
      updated_at: new Date().toISOString(),
    };
    if (this.USE_SUPABASE) {
      await supabase.from('user_2fa_settings').update(settings).eq('user_id', userId);
    } else {
      await updateDoc(doc(firebaseDb, 'user_2fa_settings', userId), settings);
    }
  }
  generateTOTPSecret() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  }
  generateQRCodeData(userId, secret, appName) {
    const label = `${appName}:${userId}`;
    const issuer = appName;
    return `otpauth://totp/${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
  }
  verifyTOTPToken(secret, token) {
    const window = 1; // Allow 1 time step before/after
    const timeStep = 30;
    const currentTime = Math.floor(Date.now() / 1000 / timeStep);
    for (let i = -window; i <= window; i++) {
      const time = currentTime + i;
      const expectedToken = this.generateTOTPToken(secret, time);
      if (expectedToken === token) {
        return true;
      }
    }
    return false;
  }
  generateTOTPToken(secret, time) {
    // Simple TOTP implementation - in production, use a proper library like 'otplib'
    const key = this.base32Decode(secret);
    const timeBuffer = Buffer.alloc(8);
    timeBuffer.writeUInt32BE(0, 0);
    timeBuffer.writeUInt32BE(time, 4);
    const hmac = CryptoJS.HmacSHA1(timeBuffer, key);
    const hmacArray = this.wordArrayToByteArray(hmac);
    const offset = hmacArray[hmacArray.length - 1] & 0xf;
    const code =
      ((hmacArray[offset] & 0x7f) << 24) |
      ((hmacArray[offset + 1] & 0xff) << 16) |
      ((hmacArray[offset + 2] & 0xff) << 8) |
      (hmacArray[offset + 3] & 0xff);
    return (code % 1000000).toString().padStart(6, '0');
  }
  base32Decode(encoded) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = '';
    for (let i = 0; i < encoded.length; i++) {
      const val = alphabet.indexOf(encoded.charAt(i));
      if (val >= 0) {
        bits += val.toString(2).padStart(5, '0');
      }
    }
    const bytes = [];
    for (let i = 0; i < bits.length; i += 8) {
      if (i + 8 <= bits.length) {
        bytes.push(parseInt(bits.substr(i, 8), 2));
      }
    }
    return Buffer.from(bytes);
  }
  wordArrayToByteArray(wordArray) {
    const words = wordArray.words;
    const sigBytes = wordArray.sigBytes;
    const bytes = [];
    for (let i = 0; i < sigBytes; i++) {
      const byte = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
      bytes.push(byte);
    }
    return bytes;
  }
  // ==================== BIOMETRIC AUTHENTICATION ====================
  async setupBiometric(userId) {
    try {
      const biometricTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (biometricTypes.length === 0) {
        throw new Error('No biometric authentication available');
      }
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !isEnrolled) {
        throw new Error('Biometric authentication not available or not set up');
      }
      // Test biometric authentication
      const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Set up biometric authentication for NaturineX',
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use password',
      });
      if (authResult.success) {
        await this.enableBiometric2FA(userId);
        return {
          success: true,
          biometricTypes,
        };
      } else {
        throw new Error('Biometric authentication failed');
      }
    } catch (error) {
      console.error('Biometric setup error:', error);
      throw error;
    }
  }
  async verifyBiometric(userId, promptMessage = 'Verify your identity') {
    try {
      const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use backup method',
      });
      return {
        success: authResult.success,
        error: authResult.error,
      };
    } catch (error) {
      console.error('Biometric verification error:', error);
      throw error;
    }
  }
  async enableBiometric2FA(userId) {
    const settings = {
      biometric_enabled: true,
      updated_at: new Date().toISOString(),
    };
    if (this.USE_SUPABASE) {
      await supabase.from('user_2fa_settings').upsert({ user_id: userId, ...settings });
    } else {
      await updateDoc(doc(firebaseDb, 'user_2fa_settings', userId), settings);
    }
  }
  // ==================== BACKUP CODES ====================
  async generateBackupCodes(userId) {
    try {
      const codes = [];
      for (let i = 0; i < 10; i++) {
        codes.push(this.generateBackupCode());
      }
      // Encrypt and store backup codes
      const encryptedCodes = codes.map((code) => this.encryptData(code));
      const settings = {
        backup_codes: JSON.stringify(encryptedCodes),
        backup_codes_used: JSON.stringify([]),
        updated_at: new Date().toISOString(),
      };
      if (this.USE_SUPABASE) {
        await supabase.from('user_2fa_settings').upsert({ user_id: userId, ...settings });
      } else {
        await updateDoc(doc(firebaseDb, 'user_2fa_settings', userId), settings);
      }
      return codes;
    } catch (error) {
      console.error('Backup codes generation error:', error);
      throw error;
    }
  }
  async verifyBackupCode(userId, code) {
    try {
      let settings;
      if (this.USE_SUPABASE) {
        const { data } = await supabase
          .from('user_2fa_settings')
          .select('backup_codes, backup_codes_used')
          .eq('user_id', userId)
          .single();
        settings = data;
      } else {
        const doc = await getDoc(doc(firebaseDb, 'user_2fa_settings', userId));
        settings = doc.data();
      }
      if (!settings?.backup_codes) {
        throw new Error('No backup codes found');
      }
      const encryptedCodes = JSON.parse(settings.backup_codes);
      const usedCodes = JSON.parse(settings.backup_codes_used || '[]');
      // Check if code is valid and not used
      for (let i = 0; i < encryptedCodes.length; i++) {
        const decryptedCode = this.decryptData(encryptedCodes[i]);
        if (decryptedCode === code && !usedCodes.includes(i)) {
          // Mark code as used
          usedCodes.push(i);
          const updateData = {
            backup_codes_used: JSON.stringify(usedCodes),
            updated_at: new Date().toISOString(),
          };
          if (this.USE_SUPABASE) {
            await supabase.from('user_2fa_settings').update(updateData).eq('user_id', userId);
          } else {
            await updateDoc(doc(firebaseDb, 'user_2fa_settings', userId), updateData);
          }
          return { success: true };
        }
      }
      throw new Error('Invalid or used backup code');
    } catch (error) {
      console.error('Backup code verification error:', error);
      throw error;
    }
  }
  generateBackupCode() {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
  // ==================== SESSION MANAGEMENT ====================
  async validateSession(userId, sessionId) {
    try {
      const sessionData = this.sessionValidation.get(sessionId);
      if (!sessionData) {
        return { valid: false, reason: 'Session not found' };
      }
      const now = Date.now();
      if (now > sessionData.expiresAt) {
        this.sessionValidation.delete(sessionId);
        return { valid: false, reason: 'Session expired' };
      }
      return {
        valid: true,
        userId: sessionData.userId,
        twoFactorVerified: sessionData.twoFactorVerified,
        expiresAt: sessionData.expiresAt,
      };
    } catch (error) {
      console.error('Session validation error:', error);
      return { valid: false, reason: 'Validation error' };
    }
  }
  async createSecureSession(userId, twoFactorVerified = false) {
    const sessionId = this.generateSessionId();
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    this.sessionValidation.set(sessionId, {
      userId,
      twoFactorVerified,
      expiresAt,
      createdAt: Date.now(),
    });
    return {
      sessionId,
      expiresAt,
      twoFactorVerified,
    };
  }
  async require2FAForOperation(userId, operation) {
    const sensitiveOperations = [
      'payment',
      'medical_data_access',
      'profile_update',
      'security_settings',
      'subscription_change',
    ];
    return sensitiveOperations.includes(operation);
  }
  // ==================== UTILITY METHODS ====================
  async getUserSettings(userId) {
    try {
      if (this.USE_SUPABASE) {
        const { data } = await supabase
          .from('user_2fa_settings')
          .select('*')
          .eq('user_id', userId)
          .single();
        return data || {};
      } else {
        const docRef = doc(firebaseDb, 'user_2fa_settings', userId);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? docSnap.data() : {};
      }
    } catch (error) {
      console.error('Get user settings error:', error);
      return {};
    }
  }
  async loadUserSettings() {
    // Load any cached settings
    try {
      const cachedSettings = await SecureStore.getItemAsync('2fa_settings');
      if (cachedSettings) {
        return JSON.parse(cachedSettings);
      }
    } catch (error) {
      console.error('Load settings error:', error);
    }
    return {};
  }
  generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
  generateSessionId() {
    return CryptoJS.lib.WordArray.random(32).toString();
  }
  encryptData(data) {
    return CryptoJS.AES.encrypt(data, this.encryptionKey).toString();
  }
  decryptData(encryptedData) {
    const bytes = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  }
  async sendSMSCode(phoneNumber, code) {
    try {
      // In production, use a proper SMS service like Twilio or AWS SNS
      // For now, we'll use a mock implementation
      if (this.USE_SUPABASE) {
        // Call Supabase Edge Function for SMS
        const { error } = await supabase.functions.invoke('send-sms', {
          body: {
            to: phoneNumber,
            message: `Your NaturineX verification code is: ${code}. Valid for 10 minutes.`,
          },
        });
        if (error) throw error;
      } else {
        // Use Expo SMS for development
        const isAvailable = await SMS.isAvailableAsync();
        if (isAvailable) {
          await SMS.sendSMSAsync(
            [phoneNumber],
            `Your NaturineX verification code is: ${code}. Valid for 10 minutes.`,
          );
        } else {
          // SMS not available - code logged for development
        }
      }
    } catch (error) {
      console.error('SMS sending error:', error);
      // Don't throw - log the code for development
    }
  }
  async disable2FA(userId, method) {
    try {
      const updateData = {};
      switch (method) {
        case 'phone':
          updateData.phone_2fa_enabled = false;
          updateData.phone_number = null;
          break;
        case 'totp':
          updateData.totp_enabled = false;
          updateData.totp_secret_encrypted = null;
          await SecureStore.deleteItemAsync(`totp_secret_${userId}`);
          break;
        case 'biometric':
          updateData.biometric_enabled = false;
          break;
        case 'all':
          updateData.phone_2fa_enabled = false;
          updateData.phone_number = null;
          updateData.totp_enabled = false;
          updateData.totp_secret_encrypted = null;
          updateData.biometric_enabled = false;
          updateData.backup_codes = null;
          updateData.backup_codes_used = null;
          await SecureStore.deleteItemAsync(`totp_secret_${userId}`);
          break;
      }
      updateData.updated_at = new Date().toISOString();
      if (this.USE_SUPABASE) {
        await supabase.from('user_2fa_settings').update(updateData).eq('user_id', userId);
      } else {
        await updateDoc(doc(firebaseDb, 'user_2fa_settings', userId), updateData);
      }
      return { success: true };
    } catch (error) {
      console.error('Disable 2FA error:', error);
      throw error;
    }
  }
}
export default new TwoFactorAuthService();
