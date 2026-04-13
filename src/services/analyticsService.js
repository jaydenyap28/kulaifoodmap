import { supabase } from '../lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

const SESSION_KEY = 'kulaifood_session_id';

const getSessionId = () => {
    let sessionId = localStorage.getItem(SESSION_KEY);
    if (!sessionId) {
        sessionId = uuidv4();
        localStorage.setItem(SESSION_KEY, sessionId);
    }
    return sessionId;
};

export const analyticsService = {
    logActivity: async (activityType, restaurantId, extraDetails = {}) => {
        if (!supabase) return;
        
        try {
            // Get current user if logged in
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id || null;
            const sessionId = getSessionId();

            await supabase
                .from('user_activity_logs')
                .insert([{
                    user_id: userId,
                    session_id: sessionId,
                    activity_type: activityType,
                    restaurant_id: Number(restaurantId),
                    details: extraDetails
                }]);
        } catch (err) {
            console.error('Analytics warning: Failed to log activity', err);
        }
    },

    logRestaurantView: async (restaurantId, restaurantName) => {
        await analyticsService.logActivity('restaurant_view', restaurantId, { name: restaurantName });
    },

    logDeliveryClick: async (restaurantId, deliveryUrl) => {
        await analyticsService.logActivity('delivery_link_click', restaurantId, { url: deliveryUrl });
    },

    getReports: async (dateFilter = 'all') => {
        if (!supabase) return [];
        const { data, error } = await supabase.rpc('admin_get_tracking_reports', { date_filter: dateFilter });
        if (error) {
            console.error('Error fetching reports:', error);
            throw error;
        }
        return data;
    }
};
