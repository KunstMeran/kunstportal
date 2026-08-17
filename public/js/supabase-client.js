/**
 * Supabase Client Configuration
 * Projektsoftware Kunst Meran
 */

// Supabase Client initialisieren mit Config
const supabaseClient = supabase.createClient(Config.supabase.url, Config.supabase.anonKey);

/**
 * Supabase Service Layer
 */
const SupabaseService = {
    client: supabaseClient,

    // AUTH METHODS
    async signIn(email, password) {
        const { data, error } = await this.client.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;
        return data;
    },

    async signOut() {
        const { error } = await this.client.auth.signOut();
        if (error) throw error;
    },

    async getCurrentUser() {
        const { data: { user }, error } = await this.client.auth.getUser();
        if (error) throw error;
        return user;
    },

    async getSession() {
        const { data: { session }, error } = await this.client.auth.getSession();
        if (error) throw error;
        return session;
    },

    // MICROSOFT SSO METHODS
    async signInWithMicrosoft() {
        const { data, error } = await this.client.auth.signInWithOAuth({
            provider: Config.microsoftSSO.providerName,
            options: {
                scopes: 'email profile openid',
                redirectTo: window.location.origin + '/app.html'
            }
        });

        if (error) throw error;
        return data;
    },

    /**
     * OAuth-Callback verarbeiten (nach Redirect von Microsoft)
     * Prüft auch die Domain-Einschränkung
     */
    async handleOAuthCallback() {
        const { data: { session }, error } = await this.client.auth.getSession();

        if (error) throw error;

        // Domain-Prüfung für Microsoft-Login
        if (session?.user?.email && Config.microsoftSSO.enabled) {
            const email = session.user.email;
            const domain = email.split('@')[1];

            if (domain !== Config.microsoftSSO.allowedDomain) {
                // Ungültige Domain - User ausloggen
                await this.signOut();
                throw new Error(`Anmeldung nur für @${Config.microsoftSSO.allowedDomain} erlaubt`);
            }
        }

        return session;
    },

    // USER METHODS
    async getUserProfile(userId) {
        const { data, error } = await this.client
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw error;
        return data;
    },

    async getAllUsers() {
        const { data, error } = await this.client
            .from('users')
            .select('id, username, email, role, hourly_rate')
            .order('username', { ascending: true });

        if (error) throw error;

        // hourly_rate zu hourlyRate konvertieren für Kompatibilität
        return (data || []).map(u => ({
            ...u,
            hourlyRate: u.hourly_rate || 0
        }));
    },

    // PROJECT METHODS
    async getProjects() {
        const { data, error } = await this.client
            .from('projects')
            .select(`
                *,
                created_by_user:users(username, email)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async getProject(projectId) {
        const { data, error } = await this.client
            .from('projects')
            .select(`
                *,
                created_by_user:users(username, email),
                budget_items(*),
                costs(*),
                funding_sources(*)
            `)
            .eq('id', projectId)
            .single();

        if (error) throw error;
        return data;
    },

    async createProject(projectData) {
        const user = await this.getCurrentUser();

        const { data, error } = await this.client
            .from('projects')
            .insert([{
                ...projectData,
                created_by: user.id
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateProject(projectId, updates) {
        const { data, error } = await this.client
            .from('projects')
            .update(updates)
            .eq('id', projectId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteProject(projectId) {
        const { error } = await this.client
            .from('projects')
            .delete()
            .eq('id', projectId);

        if (error) throw error;
    },

    // BUDGET METHODS
    async getBudgetItems(projectId) {
        const { data, error } = await this.client
            .from('budget_items')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async createBudgetItem(budgetData) {
        const { data, error } = await this.client
            .from('budget_items')
            .insert([budgetData])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateBudgetItem(budgetId, updates) {
        const { data, error } = await this.client
            .from('budget_items')
            .update(updates)
            .eq('id', budgetId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteBudgetItem(budgetId) {
        const { error } = await this.client
            .from('budget_items')
            .delete()
            .eq('id', budgetId);

        if (error) throw error;
    },

    // COST METHODS
    async getCosts(projectId) {
        const { data, error } = await this.client
            .from('costs')
            .select(`
                *,
                budget_item:budget_items(description),
                created_by_user:users(username)
            `)
            .eq('project_id', projectId)
            .order('date', { ascending: false });

        if (error) throw error;
        return data;
    },

    async createCost(costData) {
        const user = await this.getCurrentUser();

        const { data, error } = await this.client
            .from('costs')
            .insert([{
                ...costData,
                created_by: user.id
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateCost(costId, updates) {
        const { data, error } = await this.client
            .from('costs')
            .update(updates)
            .eq('id', costId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteCost(costId) {
        const { error } = await this.client
            .from('costs')
            .delete()
            .eq('id', costId);

        if (error) throw error;
    },

    // FUNDING SOURCE METHODS
    async getFundingSources(projectId) {
        const { data, error } = await this.client
            .from('funding_sources')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async createFundingSource(fundingData) {
        const { data, error } = await this.client
            .from('funding_sources')
            .insert([fundingData])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateFundingSource(fundingId, updates) {
        const { data, error } = await this.client
            .from('funding_sources')
            .update(updates)
            .eq('id', fundingId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteFundingSource(fundingId) {
        const { error } = await this.client
            .from('funding_sources')
            .delete()
            .eq('id', fundingId);

        if (error) throw error;
    },

    // REALTIME SUBSCRIPTIONS
    subscribeToProjects(callback) {
        return this.client
            .channel('projects-changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'projects' },
                callback
            )
            .subscribe();
    },

    subscribeToCosts(projectId, callback) {
        return this.client
            .channel(`costs-${projectId}`)
            .on('postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'costs',
                    filter: `project_id=eq.${projectId}`
                },
                callback
            )
            .subscribe();
    },

    unsubscribe(channel) {
        this.client.removeChannel(channel);
    }
};

// Export für andere Module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SupabaseService;
}
