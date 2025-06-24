// 📷 Barcode Recognition Utility
// Comprehensive barcode scanning and medication data extraction

import { BrowserMultiFormatReader } from '@zxing/browser';
import Quagga from 'quagga';

class BarcodeRecognition {
  constructor() {
    this.codeReader = new BrowserMultiFormatReader();
    this.isScanning = false;
    this.stream = null;
  }

  // Start barcode scanning with camera
  async startBarcodeScanning(videoElement, onDetected, onError) {
    try {
      this.isScanning = true;
      
      // Initialize Quagga for better barcode detection
      await this.initializeQuagga(videoElement, onDetected, onError);
      
      // Also use ZXing as fallback
      await this.initializeZXing(videoElement, onDetected, onError);
      
    } catch (error) {
      console.error('Error starting barcode scanning:', error);
      onError('Failed to start barcode scanner');
    }
  }

  // Initialize Quagga scanner (better for various barcode types)
  async initializeQuagga(videoElement, onDetected, onError) {
    return new Promise((resolve, reject) => {
      Quagga.init({
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: videoElement,
          constraints: {
            width: 640,
            height: 480,
            facingMode: "environment" // Back camera
          }
        },
        decoder: {
          readers: [
            "code_128_reader",
            "ean_reader",
            "ean_8_reader", 
            "code_39_reader",
            "code_39_vin_reader",
            "codabar_reader",
            "upc_reader",
            "upc_e_reader",
            "i2of5_reader",
            "datamatrix_reader"
          ]
        }
      }, (err) => {
        if (err) {
          console.error('Quagga initialization failed:', err);
          reject(err);
          return;
        }
        
        Quagga.start();
        resolve();
        
        // Set up detection handler
        Quagga.onDetected((data) => {
          if (this.isScanning) {
            const barcode = data.codeResult.code;
            const format = data.codeResult.format;
            console.log('Barcode detected:', barcode, 'Format:', format);
            this.processBarcodeData(barcode, format, onDetected);
          }
        });
      });
    });
  }

  // Initialize ZXing scanner as fallback
  async initializeZXing(videoElement, onDetected, onError) {
    try {
      const constraints = {
        video: { 
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoElement.srcObject = this.stream;
      
      // Start ZXing continuous scanning
      this.codeReader.decodeFromVideoDevice(null, videoElement, (result, err) => {
        if (result && this.isScanning) {
          const barcode = result.getText();
          const format = result.getBarcodeFormat();
          console.log('ZXing detected:', barcode, 'Format:', format);
          this.processBarcodeData(barcode, format, onDetected);
        }
        if (err && err.name !== 'NotFoundException') {
          console.error('ZXing error:', err);
        }
      });
      
    } catch (error) {
      console.error('ZXing initialization failed:', error);
      onError('Camera access denied or not available');
    }
  }

  // Process and extract medication data from barcode
  async processBarcodeData(barcode, format, onDetected) {
    try {
      console.log('Processing barcode:', barcode, 'Format:', format);
      
      const medicationData = await this.extractMedicationData(barcode, format);
      
      if (medicationData) {
        onDetected(medicationData);
        this.stopScanning();
      }
      
    } catch (error) {
      console.error('Error processing barcode data:', error);
    }
  }

  // Extract medication information from barcode data
  async extractMedicationData(barcode, format) {
    const barcodeInfo = {
      rawBarcode: barcode,
      format: format,
      scannedAt: new Date().toISOString(),
      medicationName: null,
      dosage: null,
      manufacturer: null,
      ndc: null, // National Drug Code
      lotNumber: null,
      expirationDate: null,
      gtin: null, // Global Trade Item Number
      serialNumber: null
    };

    // Different barcode formats contain different information
    switch (format) {
      case 'EAN_13':
      case 'UPC_A':
        barcodeInfo.gtin = barcode;
        await this.lookupMedicationByGTIN(barcode, barcodeInfo);
        break;
        
      case 'CODE_128':
        await this.parseCode128MedicationData(barcode, barcodeInfo);
        break;
        
      case 'DATAMATRIX':
        await this.parseDataMatrixMedicationData(barcode, barcodeInfo);
        break;
        
      default:
        // Try to extract any recognizable patterns
        await this.parseGenericMedicationData(barcode, barcodeInfo);
    }

    return barcodeInfo;
  }

  // Lookup medication by GTIN (UPC/EAN codes)
  async lookupMedicationByGTIN(gtin, barcodeInfo) {
    try {
      // In a real implementation, you'd call a medication database API
      // For now, we'll use pattern recognition and mock data
      
      const mockMedicationDatabase = {
        '123456789012': {
          name: 'Acetaminophen 500mg',
          manufacturer: 'Generic Pharma',
          dosage: '500mg',
          type: 'tablet'
        },
        '987654321098': {
          name: 'Ibuprofen 200mg', 
          manufacturer: 'Pain Relief Inc',
          dosage: '200mg',
          type: 'capsule'
        }
      };

      const medication = mockMedicationDatabase[gtin];
      if (medication) {
        barcodeInfo.medicationName = medication.name;
        barcodeInfo.dosage = medication.dosage;
        barcodeInfo.manufacturer = medication.manufacturer;
        barcodeInfo.type = medication.type;
      } else {
        // If not in mock database, try to extract from barcode patterns
        barcodeInfo.medicationName = `Unknown Medication (GTIN: ${gtin})`;
      }
      
    } catch (error) {
      console.error('Error looking up GTIN:', error);
    }
  }

  // Parse Code 128 barcode for medication data
  async parseCode128MedicationData(barcode, barcodeInfo) {
    try {
      // Code 128 can contain NDC numbers and other structured data
      
      // NDC pattern: typically 10-11 digits in format XXXXX-XXXX-XX or similar
      const ndcPattern = /(\d{4,5})-?(\d{3,4})-?(\d{1,2})/;
      const ndcMatch = barcode.match(ndcPattern);
      
      if (ndcMatch) {
        barcodeInfo.ndc = ndcMatch[0];
        barcodeInfo.medicationName = `Medication (NDC: ${barcodeInfo.ndc})`;
      }

      // Look for lot numbers (usually start with LOT, L, or just numbers)
      const lotPattern = /(LOT|L)([A-Z0-9]+)/i;
      const lotMatch = barcode.match(lotPattern);
      if (lotMatch) {
        barcodeInfo.lotNumber = lotMatch[2];
      }

      // Look for expiration dates (various formats)
      const expPattern = /(EXP|E)(\d{6}|\d{8})/i;
      const expMatch = barcode.match(expPattern);
      if (expMatch) {
        barcodeInfo.expirationDate = this.parseExpirationDate(expMatch[2]);
      }

      // If no specific medication name found, use generic description
      if (!barcodeInfo.medicationName) {
        barcodeInfo.medicationName = `Scanned Medication (Code 128)`;
      }
      
    } catch (error) {
      console.error('Error parsing Code 128:', error);
    }
  }

  // Parse DataMatrix barcode (common on pharmaceutical products)
  async parseDataMatrixMedicationData(barcode, barcodeInfo) {
    try {
      // DataMatrix can contain structured data with identifiers
      
      // GS1 DataMatrix format parsing
      const gs1Pattern = /\]d2(\d{14})(\d{17})(\d{6})/;
      const gs1Match = barcode.match(gs1Pattern);
      
      if (gs1Match) {
        barcodeInfo.gtin = gs1Match[1];
        barcodeInfo.serialNumber = gs1Match[2];
        barcodeInfo.expirationDate = this.parseExpirationDate(gs1Match[3]);
      }

      // Look for medication identifiers
      if (barcode.includes('01')) { // GTIN identifier
        const gtinMatch = barcode.match(/01(\d{14})/);
        if (gtinMatch) barcodeInfo.gtin = gtinMatch[1];
      }

      if (barcode.includes('21')) { // Serial number identifier
        const serialMatch = barcode.match(/21([A-Z0-9]+)/);
        if (serialMatch) barcodeInfo.serialNumber = serialMatch[1];
      }

      if (barcode.includes('17')) { // Expiration date identifier
        const expMatch = barcode.match(/17(\d{6})/);
        if (expMatch) barcodeInfo.expirationDate = this.parseExpirationDate(expMatch[1]);
      }

      if (barcode.includes('10')) { // Lot/batch identifier
        const lotMatch = barcode.match(/10([A-Z0-9]+)/);
        if (lotMatch) barcodeInfo.lotNumber = lotMatch[1];
      }

      barcodeInfo.medicationName = `Pharmaceutical Product (DataMatrix)`;
      
    } catch (error) {
      console.error('Error parsing DataMatrix:', error);
    }
  }

  // Parse generic barcode data for any medication information
  async parseGenericMedicationData(barcode, barcodeInfo) {
    try {
      // Look for common medication name patterns
      const medicationPatterns = [
        /acetaminophen/i,
        /ibuprofen/i,
        /aspirin/i,
        /tylenol/i,
        /advil/i,
        /aleve/i,
        /benadryl/i,
        /tums/i,
        /pepto/i
      ];

      for (const pattern of medicationPatterns) {
        if (pattern.test(barcode)) {
          barcodeInfo.medicationName = barcode.match(pattern)[0];
          break;
        }
      }

      // Look for dosage patterns
      const dosagePattern = /(\d+)\s?(mg|mcg|g|ml|tablets?|caps?)/i;
      const dosageMatch = barcode.match(dosagePattern);
      if (dosageMatch) {
        barcodeInfo.dosage = dosageMatch[0];
      }

      // If no medication name found, use the full barcode as reference
      if (!barcodeInfo.medicationName) {
        barcodeInfo.medicationName = `Scanned Product (${barcode.substring(0, 20)}...)`;
      }
      
    } catch (error) {
      console.error('Error parsing generic barcode:', error);
    }
  }

  // Parse expiration date from various formats
  parseExpirationDate(dateString) {
    try {
      if (dateString.length === 6) {
        // YYMMDD format
        const year = '20' + dateString.substring(0, 2);
        const month = dateString.substring(2, 4);
        const day = dateString.substring(4, 6);
        return `${year}-${month}-${day}`;
      } else if (dateString.length === 8) {
        // YYYYMMDD format
        const year = dateString.substring(0, 4);
        const month = dateString.substring(4, 6);
        const day = dateString.substring(6, 8);
        return `${year}-${month}-${day}`;
      }
    } catch (error) {
      console.error('Error parsing expiration date:', error);
    }
    return dateString;
  }

  // Stop barcode scanning
  stopScanning() {
    this.isScanning = false;
    
    try {
      // Stop Quagga
      if (typeof Quagga !== 'undefined') {
        Quagga.stop();
      }
      
      // Stop ZXing
      if (this.codeReader) {
        this.codeReader.reset();
      }
      
      // Stop camera stream
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
      }
    } catch (error) {
      console.error('Error stopping scanner:', error);
    }
  }

  // Check if barcode scanning is supported
  static isSupported() {
    return navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
  }

  // Get barcode scanning capabilities
  static getCapabilities() {
    return {
      supported: this.isSupported(),
      formats: [
        'UPC-A', 'UPC-E', 'EAN-13', 'EAN-8',
        'Code 128', 'Code 39', 'Code 93',
        'Codabar', 'ITF', 'DataMatrix',
        'PDF417', 'QR Code'
      ],
      features: [
        'Medication name extraction',
        'NDC number detection', 
        'Lot number parsing',
        'Expiration date detection',
        'GTIN/UPC lookup',
        'Serial number extraction'
      ]
    };
  }
}

export default BarcodeRecognition;
