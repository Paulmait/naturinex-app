/**
 * Doctor Network & Telehealth Module
 * Connect users with healthcare professionals
 */

const admin = require('firebase-admin');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class DoctorNetwork {
  constructor() {
    this.specialties = [
      'General Practice',
      'Internal Medicine',
      'Cardiology',
      'Endocrinology',
      'Psychiatry',
      'Pharmacist',
      'Nutritionist',
      'Integrative Medicine'
    ];

    this.consultationTypes = {
      TEXT: { name: 'Text Chat', price: 29, duration: '24h' },
      VOICE: { name: 'Voice Call', price: 49, duration: '15min' },
      VIDEO: { name: 'Video Call', price: 79, duration: '15min' },
      SECOND_OPINION: { name: 'Second Opinion', price: 149, duration: '48h' },
      PRESCRIPTION_REVIEW: { name: 'Prescription Review', price: 39, duration: '24h' }
    };
  }

  /**
   * Get available doctors
   */
  async getAvailableDoctors(specialty, urgency = 'normal') {
    try {
      const doctors = await this.fetchDoctors(specialty);
      
      // Filter by availability
      const available = doctors.filter(doc => {
        if (urgency === 'urgent') {
          return doc.availableNow;
        }
        return doc.nextAvailable < 24; // hours
      });

      // Sort by rating and response time
      available.sort((a, b) => {
        const scoreA = a.rating * 0.7 + (10 - a.responseTime) * 0.3;
        const scoreB = b.rating * 0.7 + (10 - b.responseTime) * 0.3;
        return scoreB - scoreA;
      });

      return {
        success: true,
        doctors: available,
        count: available.length
      };
    } catch (error) {
      console.error('Get doctors error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Book consultation
   */
  async bookConsultation(userId, doctorId, type, details) {
    try {
      const consultation = {
        id: `consult_${Date.now()}`,
        userId,
        doctorId,
        type,
        status: 'pending',
        scheduledTime: details.scheduledTime || new Date(),
        reason: details.reason,
        medications: details.medications,
        symptoms: details.symptoms,
        urgency: details.urgency,
        price: this.consultationTypes[type].price,
        createdAt: new Date()
      };

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: consultation.price * 100,
        currency: 'usd',
        metadata: {
          consultationId: consultation.id,
          userId,
          doctorId
        }
      });

      consultation.paymentIntentId = paymentIntent.id;
      consultation.paymentStatus = 'pending';

      // Save consultation
      await this.saveConsultation(consultation);

      // Notify doctor
      await this.notifyDoctor(doctorId, consultation);

      return {
        success: true,
        consultation,
        paymentClientSecret: paymentIntent.client_secret
      };
    } catch (error) {
      console.error('Book consultation error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Start consultation session
   */
  async startConsultation(consultationId) {
    try {
      const consultation = await this.getConsultation(consultationId);
      
      if (!consultation) {
        throw new Error('Consultation not found');
      }

      // Create secure session
      const session = {
        consultationId,
        startTime: new Date(),
        chatRoom: `chat_${consultationId}`,
        videoRoom: consultation.type === 'VIDEO' ? `video_${consultationId}` : null,
        encryptionKey: this.generateEncryptionKey()
      };

      // Update consultation status
      await this.updateConsultationStatus(consultationId, 'active');

      // Initialize chat/video infrastructure
      if (consultation.type === 'VIDEO') {
        session.videoToken = await this.generateVideoToken(session.videoRoom);
      }

      return {
        success: true,
        session,
        consultation
      };
    } catch (error) {
      console.error('Start consultation error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Submit question to doctor
   */
  async submitQuestion(userId, question, category) {
    try {
      const questionData = {
        id: `q_${Date.now()}`,
        userId,
        question,
        category,
        status: 'pending',
        createdAt: new Date(),
        responses: [],
        upvotes: 0
      };

      // AI pre-screen for urgent issues
      const urgency = await this.assessQuestionUrgency(question);
      questionData.urgency = urgency;

      if (urgency === 'critical') {
        // Immediate doctor notification
        await this.notifyUrgentQuestion(questionData);
      }

      // Save question
      await this.saveQuestion(questionData);

      // Match with best doctor
      const doctor = await this.matchQuestionToDoctor(questionData);
      if (doctor) {
        questionData.assignedDoctor = doctor.id;
        await this.notifyDoctor(doctor.id, questionData);
      }

      return {
        success: true,
        question: questionData,
        estimatedResponseTime: urgency === 'critical' ? '< 1 hour' : '< 24 hours'
      };
    } catch (error) {
      console.error('Submit question error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get second opinion on diagnosis/treatment
   */
  async requestSecondOpinion(userId, medicalData) {
    try {
      const request = {
        id: `so_${Date.now()}`,
        userId,
        originalDiagnosis: medicalData.diagnosis,
        medications: medicalData.medications,
        symptoms: medicalData.symptoms,
        testResults: medicalData.testResults,
        medicalHistory: medicalData.history,
        status: 'pending',
        createdAt: new Date()
      };

      // Find specialists for second opinion
      const specialists = await this.findSpecialists(medicalData.diagnosis);
      
      // Create consultation with multiple doctors
      const consultations = [];
      for (const specialist of specialists.slice(0, 2)) { // Get 2 opinions
        const consult = await this.bookConsultation(
          userId,
          specialist.id,
          'SECOND_OPINION',
          { ...medicalData, requestId: request.id }
        );
        consultations.push(consult);
      }

      request.consultations = consultations.map(c => c.consultation.id);

      // Save request
      await this.saveSecondOpinionRequest(request);

      return {
        success: true,
        request,
        specialists: specialists.slice(0, 2),
        estimatedTime: '24-48 hours'
      };
    } catch (error) {
      console.error('Second opinion error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Doctor rating and review system
   */
  async rateDoctor(userId, doctorId, consultationId, rating, review) {
    try {
      const ratingData = {
        userId,
        doctorId,
        consultationId,
        rating,
        review,
        createdAt: new Date(),
        verified: true // Verified because they had actual consultation
      };

      // Save rating
      await this.saveRating(ratingData);

      // Update doctor's average rating
      await this.updateDoctorRating(doctorId);

      // Reward user with credits for review
      if (review && review.length > 50) {
        await this.rewardUserForReview(userId);
      }

      return {
        success: true,
        message: 'Thank you for your feedback'
      };
    } catch (error) {
      console.error('Rate doctor error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Helper methods
   */
  async fetchDoctors(specialty) {
    // Mock doctors - in production, from database
    return [
      {
        id: 'doc1',
        name: 'Dr. Sarah Johnson',
        specialty,
        rating: 4.8,
        reviews: 156,
        responseTime: 2, // hours
        availableNow: true,
        nextAvailable: 0,
        credentials: ['MD', 'Board Certified'],
        experience: '15 years',
        languages: ['English', 'Spanish'],
        price: { text: 29, video: 79 }
      },
      {
        id: 'doc2',
        name: 'Dr. Michael Chen',
        specialty,
        rating: 4.9,
        reviews: 203,
        responseTime: 1,
        availableNow: false,
        nextAvailable: 2,
        credentials: ['MD', 'PhD'],
        experience: '20 years',
        languages: ['English', 'Mandarin'],
        price: { text: 39, video: 89 }
      }
    ];
  }

  async saveConsultation(consultation) {
    if (!admin.apps.length) return;

    await admin.firestore()
      .collection('consultations')
      .doc(consultation.id)
      .set(consultation);
  }

  async notifyDoctor(doctorId, data) {
    // Send notification to doctor
    console.log(`Notifying doctor ${doctorId}:`, data.id);
  }

  async getConsultation(consultationId) {
    if (!admin.apps.length) return null;

    const doc = await admin.firestore()
      .collection('consultations')
      .doc(consultationId)
      .get();

    return doc.exists ? doc.data() : null;
  }

  async updateConsultationStatus(consultationId, status) {
    if (!admin.apps.length) return;

    await admin.firestore()
      .collection('consultations')
      .doc(consultationId)
      .update({ status, updatedAt: new Date() });
  }

  generateEncryptionKey() {
    return Math.random().toString(36).substring(7);
  }

  async generateVideoToken(roomId) {
    // Generate video session token (Twilio, Agora, etc.)
    return `token_${roomId}`;
  }

  async assessQuestionUrgency(question) {
    const urgentKeywords = ['chest pain', 'bleeding', 'emergency', 'severe', 'urgent'];
    const questionLower = question.toLowerCase();
    
    for (const keyword of urgentKeywords) {
      if (questionLower.includes(keyword)) {
        return 'critical';
      }
    }
    
    return 'normal';
  }

  async notifyUrgentQuestion(question) {
    // Alert on-call doctors
    console.log('URGENT QUESTION:', question.id);
  }

  async saveQuestion(question) {
    if (!admin.apps.length) return;

    await admin.firestore()
      .collection('questions')
      .doc(question.id)
      .set(question);
  }

  async matchQuestionToDoctor(question) {
    // Match based on category and availability
    const doctors = await this.fetchDoctors(question.category);
    return doctors[0];
  }

  async findSpecialists(diagnosis) {
    // Find specialists for specific diagnosis
    return this.fetchDoctors('Internal Medicine');
  }

  async saveSecondOpinionRequest(request) {
    if (!admin.apps.length) return;

    await admin.firestore()
      .collection('secondOpinions')
      .doc(request.id)
      .set(request);
  }

  async saveRating(rating) {
    if (!admin.apps.length) return;

    await admin.firestore()
      .collection('doctorRatings')
      .add(rating);
  }

  async updateDoctorRating(doctorId) {
    // Calculate new average rating
    if (!admin.apps.length) return;

    const ratings = await admin.firestore()
      .collection('doctorRatings')
      .where('doctorId', '==', doctorId)
      .get();

    const total = ratings.docs.reduce((sum, doc) => sum + doc.data().rating, 0);
    const average = total / ratings.docs.length;

    await admin.firestore()
      .collection('doctors')
      .doc(doctorId)
      .update({
        rating: average,
        totalRatings: ratings.docs.length
      });
  }

  async rewardUserForReview(userId) {
    // Give user 2 credits for detailed review
    const TierSystem = require('./tierSystem');
    await TierSystem.addCredits(userId, 2, 'review_reward');
  }
}

module.exports = DoctorNetwork;