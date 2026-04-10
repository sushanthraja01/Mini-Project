const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const Farmer = require('../models/Farmer');
require('dotenv').config();

const router = express.Router();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const CALLBACK_URL = 'http://localhost:3000/auth/google/callback';
const FRONTEND_URL = 'http://localhost:5173';

// Step 1: Redirect user to Google consent screen
router.get('/google', (req, res) => {
    const googleAuthURL = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${GOOGLE_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(CALLBACK_URL)}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent('openid email profile')}` +
        `&access_type=offline` +
        `&prompt=consent`;

    res.redirect(googleAuthURL);
});

// Step 2: Handle Google callback — exchange code for tokens, find/create user, issue JWT
router.get('/google/callback', async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.redirect(`${FRONTEND_URL}/login?error=no_code`);
    }

    try {
        // Exchange authorization code for access token
        const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
            code,
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            redirect_uri: CALLBACK_URL,
            grant_type: 'authorization_code',
        });

        const { access_token } = tokenResponse.data;

        // Fetch user profile from Google
        const profileResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${access_token}` },
        });

        const { email, name, picture } = profileResponse.data;

        if (!email) {
            return res.redirect(`${FRONTEND_URL}/login?error=no_email`);
        }

        // Find or create Farmer in the database
        let farmer = await Farmer.findOne({ email });

        if (!farmer) {
            // New Google user → create account (no password for Google users)
            farmer = new Farmer({
                name: name || email.split('@')[0],
                email,
                password: '__google_oauth__', // placeholder, never used for login
            });
            await farmer.save();
        }

        // Generate JWT token (same as normal login)
        const token = jwt.sign({ fid: farmer._id }, process.env.JWT_SECRET);

        // Redirect to frontend with token + user info in URL params
        const params = new URLSearchParams({
            token,
            name: farmer.name,
            email: farmer.email,
        });

        res.redirect(`${FRONTEND_URL}/auth/callback?${params.toString()}`);

    } catch (error) {
        console.error('Google OAuth error:', error.response?.data || error.message);
        res.redirect(`${FRONTEND_URL}/login?error=auth_failed`);
    }
});

module.exports = router;
