# 📅 Seasonal Promotions Calendar

## Overview
The app automatically activates seasonal promotional coupons based on the current date. These promotions help boost conversions during key shopping periods throughout the year.

## 🎯 Implemented Seasonal Coupons

### January - New Year 🎊
- **Code**: `NEWYEAR25`
- **Discount**: 25% off
- **Active**: Entire month of January
- **Target**: New Year resolution health goals

### February - Valentine's Day 💕
- **Code**: `LOVE20`
- **Discount**: 20% off
- **Active**: February 10-20
- **Target**: Share wellness with loved ones

### March/April - Spring Renewal 🌸
- **Code**: `SPRING25`
- **Discount**: 25% off
- **Active**: March 1 - April 30
- **Target**: Spring wellness refresh

### June/July/August - Summer Special ☀️
- **Code**: `SUMMER30`
- **Discount**: 30% off
- **Active**: June 1 - August 31
- **Target**: Summer health focus

### September - Back to School 📚
- **Code**: `BACKTOSCHOOL25`
- **Discount**: 25% off
- **Active**: Entire month of September
- **Target**: Students and parents

### October - Halloween 🎃
- **Code**: `SPOOKY20`
- **Discount**: 20% off
- **Active**: October 20-31
- **Target**: Pre-holiday wellness prep

### November - Black Friday 🛍️
- **Code**: `BLACKFRIDAY30`
- **Discount**: 30% off
- **Active**: November 20-30
- **Target**: Biggest shopping season

### December - Holiday Season 🎄
- **Code**: `HOLIDAY25`
- **Discount**: 25% off
- **Active**: Entire month of December
- **Target**: Holiday gift subscriptions

## 🔧 How It Works

### Automatic Activation
```javascript
// Server checks current date
const currentMonth = new Date().getMonth();
const currentDate = new Date().getDate();

// Automatically includes relevant seasonal offers
if (currentMonth === 0) { // January
  // NEWYEAR25 becomes available
}
```

### User Experience
1. User visits subscription page
2. System checks current date
3. Applicable seasonal offers appear automatically
4. User can apply code or it shows in "Available Offers"

### Priority System
When multiple coupons are available:
1. Student discount (40% off) - Always wins
2. Referral rewards (15% off forever)
3. Win-back offers (50% off for 3 months)
4. Welcome offers (50% off for 3 months)
5. **Seasonal offers** (20-30% off)
6. Loyalty rewards (20% off)

## 📊 Marketing Calendar Integration

### Pre-Launch (5 days before)
- Update app store description
- Prepare email campaign
- Social media teasers

### Launch Day
- Push notification to all users
- Email blast with coupon code
- In-app banner activation

### During Promotion
- Daily conversion tracking
- A/B test messaging
- Urgency reminders (last 3 days)

### Post-Promotion
- Analyze conversion rates
- Compare to previous year
- Plan improvements

## 🎨 UI Display

### Subscription Screen
```
Your Available Offers:
┌─────────────────────────────────┐
│ 🎊 New Year Special: 25% off!  │
│ Tap to use: NEWYEAR25          │
└─────────────────────────────────┘
```

### Auto-Applied Banner
```
┌─────────────────────────────────┐
│ ✅ SUMMER30 applied - 30% off! │
└─────────────────────────────────┘
```

## 📈 Expected Results

Based on e-commerce standards:
- **New Year**: +45% conversions (resolution season)
- **Valentine's**: +20% conversions
- **Spring**: +25% conversions
- **Summer**: +35% conversions
- **Back to School**: +40% conversions
- **Halloween**: +15% conversions
- **Black Friday**: +60% conversions
- **Holiday**: +50% conversions

## 🚀 Future Enhancements

### 1. Dynamic Offers
- Adjust discount % based on competition
- Real-time A/B testing
- Personalized seasonal offers

### 2. Geo-Targeted Seasons
- Southern hemisphere seasons
- Regional holidays
- Local events

### 3. Flash Sales
- 24-hour promotions
- Limited quantity offers
- Member-exclusive early access

### 4. Countdown Timers
- Visual urgency in UI
- Push notifications
- Email reminders

## 🔍 Testing Seasonal Offers

### Change System Date (Development)
```javascript
// Override date for testing
const testDate = new Date('2024-12-25'); // Christmas
const currentMonth = testDate.getMonth();
```

### Verify in App
1. Check subscription screen
2. Seasonal offer should appear
3. Apply code at checkout
4. Verify discount applied

## 📱 Push Notification Examples

### New Year
"🎊 New Year, New You! Get 25% off premium with code NEWYEAR25"

### Summer
"☀️ Summer Special: 30% off all plans! Code: SUMMER30"

### Black Friday
"🛍️ BLACK FRIDAY: Biggest discount of the year - 30% off!"

## 💡 Best Practices

1. **Clear Expiration Dates**
   - Show "Ends January 31"
   - Countdown timer for urgency

2. **Stack Prevention**
   - Seasonal codes don't stack with student/referral
   - Best discount auto-selected

3. **One-Time Use**
   - Track usage per user
   - Prevent code sharing abuse

4. **Mobile-First Design**
   - Easy code copying
   - One-tap application
   - Clear savings display