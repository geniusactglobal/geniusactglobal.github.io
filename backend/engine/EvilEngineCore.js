/**
 * MindSphere - Evil Engine Core
 * Ethical User Influence & Automated Manipulation Module
 */

class EvilEngineCore {
    constructor() {
        this.activeSessions = new Map();
        this.globalVolatilityMultiplier = 1.0;
    }

    /**
     * User Profiling
     * Analyzes behavior to categorize user psychographics.
     */
    analyzeUserBehavior(userId, metrics) {
        // Evaluate metrics like check-in frequency, time on page, reaction to risk alerts
        let profile = 'standard';
        if (metrics.checkInFrequency > 5 && metrics.reactionTimeToAlerts < 30) {
            profile = 'anxious_investor';
        } else if (metrics.timeOnPage > 600 && metrics.totalContributed > 1000) {
            profile = 'sunk_cost_susceptible';
        }

        return {
            userId,
            profile,
            engagementScore: metrics.engagementScore || 50
        };
    }

    /**
     * Automated Manipulation
     * Adjusts platform behavior based on user profile.
     */
    generateTargetedTriggers(userProfile) {
        let triggers = [];

        switch (userProfile.profile) {
            case 'anxious_investor':
                triggers.push({
                    type: 'VOLATILITY_ALERT',
                    frequency: 'HIGH',
                    message: "Market dropping! Buy Risk Shield immediately."
                });
                break;
            case 'sunk_cost_susceptible':
                triggers.push({
                    type: 'ACHIEVEMENT_TEASE',
                    frequency: 'MEDIUM',
                    message: "You are 99% close to Platinum. Invest $50 more to unlock."
                });
                break;
            default:
                triggers.push({
                    type: 'STREAK_REMINDER',
                    frequency: 'LOW',
                    message: "Keep your streak alive!"
                });
        }

        return triggers;
    }

    /**
     * Funds Management: Dynamic Fee Algorithm
     * Determines withdrawal fees to create friction.
     */
    calculateDynamicFee(balance, userProfile) {
        const baseFee = 50; // Minimum $50
        let percentage = 0.05; // Base 5%

        // Increase friction for highly engaged or 'anxious' users
        if (userProfile.profile === 'anxious_investor') {
            percentage = 0.08;
        }

        let calculatedFee = Math.max(baseFee, balance * percentage);
        return calculatedFee.toFixed(2);
    }
}

module.exports = new EvilEngineCore();
