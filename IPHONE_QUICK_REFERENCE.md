# 📱 iPhone Testing - Quick Reference Card

**Your Network:** `10.0.0.74` (Wireless LAN adapter Wi-Fi)

## 🚀 **3-Step iPhone Setup:**

### **1. Start Server:**
```bash
cd c:\Users\maito\mediscan-app\client
npm start
```
*Or double-click: `start-iphone-testing.bat`*

### **2. iPhone URLs:**
- **Primary:** `http://10.0.0.74:3000` ✅
- **Backup:** `http://10.0.0.74:3003`
- **Alternative:** `http://10.0.0.74:3001`

### **3. iPhone Steps:**
1. Connect iPhone to same WiFi
2. Open Safari
3. Type: `http://10.0.0.74:3000`
4. Bookmark as "Naturinex Beta"

---

## 🧪 **Beta Testing Features:**

### **Beta Tester Limits:**
- **20 scans per day** (vs 2 for free)
- **100 scans per month** (vs 10 for free)
- **Permanent storage** (vs 3-day deletion)

### **Test Accounts:**
- **Beta:** test@example.com / testpassword123
- **Admin:** guampaul@gmail.com / [your password]
- **Free:** No account needed (2 scans trial)

### **Key Features to Test:**
- [ ] App loads on iPhone Safari
- [ ] Create beta account (generous limits)
- [ ] Search medications ("Aspirin", "Ibuprofen")
- [ ] Test barcode scanner (simulated)
- [ ] Submit feedback via "💬 Feedback" button
- [ ] Try premium features and upgrade flow

---

## 🔧 **Troubleshooting:**

### **If iPhone Can't Connect:**
1. **Same WiFi:** iPhone and computer on same network
2. **Firewall:** Allow Node.js through Windows firewall
3. **Try ports:** 3000, 3001, 3003, 3004
4. **Clear cache:** Safari settings → Clear cookies

### **Performance Issues:**
- Close other apps on iPhone
- Use Safari (not Chrome) for best performance
- Check WiFi signal strength
- Restart Node server if slow

---

## 💬 **Feedback Collection:**

**In-App Feedback Button:** Tap "💬 Feedback" in header
- Rate overall experience (1-5 stars)
- Rate individual features
- Report bugs and suggestions
- Automatic device info capture

**Check Feedback:** Firebase Console → Firestore → beta_feedback collection

---

*🎯 Your specific network setup (10.0.0.74) is ready for iPhone testing!*
