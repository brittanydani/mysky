# Privacy Policy for MySky

**Last updated: March 28, 2026**

## Our Commitment

MySky is designed with privacy by design and by default. We use zero analytics SDKs, collect zero advertising identifiers, and perform zero cross-app or cross-site tracking. Your data is never sold, shared for advertising, or used for AI/ML training.

## 1. Information We Collect

### Birth Data & Charts

Date, time (optional), and place of birth are stored exclusively on your device in a local SQLite database with AES-256-GCM field-level encryption on sensitive fields (birth place, coordinates, name, birth date, and birth time). Used to calculate planetary positions, house systems, and natal chart aspects via on-device Swiss Ephemeris.

### Daily Check-Ins

Mood scores, energy levels, stress levels, influence tags, emotional quality tags, notes, wins, and challenges are all stored locally and encrypted at rest. No raw check-in data is ever transmitted. If you opt in to the Premium AI Reflections feature, only aggregated, non-identifying statistics (trend averages, top tags, correlations) derived from check-in data are sent — never individual entries.

### Journal Entries

Free-text journal content is processed entirely on-device via local NLP for keyword extraction, emotion tagging, and sentiment reflection. Raw text, titles, and NLP results are encrypted at rest and never transmitted.

### Sleep & Dream Logs

Sleep data is stored locally on your device. Dream text, dream feelings, dream mood, dream metadata, and notes are encrypted at rest using AES-256-GCM. Sleep quality and duration are stored locally but not encrypted. Dream reflections are generated entirely on-device using symbolic pattern mapping — no AI service is involved.

### Relationship Charts

Synastry partner data (name, birth data) is stored locally and encrypted. Birth place fields use the same AES-256-GCM encryption as your own data.

### Self-Discovery Profile Data

When you use identity tools such as the Core Values Inventory, Jungian Archetype Profile, or Cognitive Style assessment, your responses and resulting profile data are stored exclusively on your device and encrypted at rest with AES-256-GCM. This data is never transmitted to any server and is never used for advertising, analytics, or AI/ML training.

### Somatic & Nervous System Entries

Body sensation logs (somatic map entries, body location tags, intensity ratings, linked emotions) and nervous system entries (trigger descriptions, dysregulation context, restoring practice notes) are stored locally and encrypted at rest with AES-256-GCM. This is among the most sensitive data in the app. It is never transmitted, never processed by any external service, and never shared.

### Relationship Pattern Entries

Self-reported relational pattern notes (recurring dynamics, communication tendencies, attachment observations) are stored locally and encrypted. No synastry or astrological matching is performed on this data.

### Premium AI Features (Optional)

MySky includes two optional AI-powered features that transmit data to external services:

**AI Reflection Insights** — Requires both a Deeper Sky subscription and account creation. Aggregated behavioral statistics (mood/stress/energy trends, top tags, correlation data) are sent to a Supabase Edge Function which calls Anthropic Claude. Raw journal text, birth data, dream content, and personal notes are never transmitted. Rate limited to 5 requests per hour, enforced server-side.

**AI-Enhanced Dream Interpretations** — When available, dream text and selected dream feelings are sent to Google Gemini to generate a richer narrative interpretation. No birth data, user identifiers, or other personal information is included. This supplements the on-device dream engine; the on-device interpretation is always generated first regardless of AI availability.

**AI Pattern Insights** — When available, aggregated self-knowledge context (dominant archetype, top core values, cognitive style summary, top somatic pattern region, top relationship pattern tags, and behavioral check-in averages) is sent to Google Gemini to generate personalized pattern reflections. Raw journal text, birth data, dream content, and personal notes are never transmitted.

### iOS Widgets

If you use MySky's iOS home screen widgets, recent check-in data (mood, energy, and sleep scores) is shared with the widget extension via a sandboxed App Group container on your device. This data never leaves your device and is not transmitted to any server.

## 2. Data Security

### Encryption at Rest

Sensitive fields — journal content, titles, birth places, dream text, mood/stress/energy scores, emotional tags, check-in notes, wins, challenges, and NLP results — use AES-256-GCM field-level encryption. The data encryption key is stored in your device's hardware-backed SecureStore (iOS Keychain / Android Keystore).

### Tamper Detection

SecureStore payloads are protected with HMAC-SHA256 tamper detection using a device-unique key. Security events are logged in a rolling audit trail for your transparency.

### Backup Encryption

Encrypted .msky backups use AES-256-GCM with PBKDF2-SHA256 key derivation (100,000 iterations) from your chosen passphrase. Backups are never uploaded to any server — you control where they go via your device's share sheet.

## 3. Third-Party Services

- **RevenueCat:** Device identifier generated by the RevenueCat SDK for subscription and in-app purchase verification. No personal data is shared. No explicit user identifiers are set by MySky.
- **OpenStreetMap Nominatim:** Birth city text sent for geocoding to coordinates. Only the city name string is transmitted.
- **Supabase:** Account creation (email/password) required for AI Reflection Insights. Session tokens stored in device secure storage.
- **Anthropic Claude:** AI Reflection Insights via Supabase Edge Function. Receives only aggregated behavioral stats — never raw text, birth data, or personal notes. API key lives exclusively in the Edge Function environment.
- **Google Gemini:** AI-enhanced dream interpretations and pattern insights. Dream text and feelings are sent for dream interpretations. Aggregated self-knowledge context (archetype, values, cognitive style, somatic patterns, relationship patterns, and check-in averages) is sent for pattern insights. No birth data, user identifiers, or raw journal text is transmitted. API key is stored as an environment variable in the app bundle.

## 4. No Tracking

MySky declares NSPrivacyTracking: false with an empty tracking domains list. No analytics SDKs (no Firebase, Amplitude, Mixpanel, Sentry, or Crashlytics) are included. No advertising identifiers are collected. Android explicitly blocks Camera, Microphone, Contacts, Calendar, SMS, Phone, and Location permissions.

## 5. Apple Privacy Manifest

Data types declared in our Apple Privacy Manifest:

- **Coarse Location:** For timezone resolution via on-device tz-lookup (not GPS tracking).
- **User ID:** For optional Supabase authentication only.
- **Purchases:** For RevenueCat subscription verification.

All data types are declared as not linked to identity and not used for tracking.

## 6. Your Rights

Under GDPR, CCPA, and applicable privacy law, you have the following rights over your personal data:

### Right of Access

View all data MySky holds about you at any time via Privacy Settings, including a full data inventory, consent status, and recent security events.

### Right to Data Portability

Export your complete data as a structured, machine-readable JSON archive via Privacy Settings, or as an encrypted .msky backup from the Settings tab (premium).

### Right to Erasure

Delete all personal data at any time using the "Hard Reset" option in Privacy Settings. This permanently erases all data from SQLite and SecureStore with best-effort secure deletion. Uninstalling the app also erases all locally stored data.

### Right to Rectification

Update your birth data, edit or delete journal entries, modify sleep logs, and manage relationship charts at any time directly within the app.

### Right to Withdraw Consent

Withdraw your data processing consent at any time via Privacy Settings. Existing data is preserved but no new personal data will be collected until consent is restored.

### Right to Restrict Processing

Since all core processing happens on-device, you control it entirely. Withdrawing consent blocks all data writes until consent is restored.

## 7. Data Retention

Your data is stored locally on your device for as long as you keep the app installed. Consent records expire after 365 days and will be re-requested. There is no server-side storage of personal data beyond optional Supabase authentication credentials.

## 8. Children's Privacy

MySky is intended for users aged 17 and older. We do not knowingly collect personal information from children under 17. If we learn we have inadvertently collected data from a user under 17, we will take steps to delete that data promptly.

## 9. Subscriptions & Payments

MySky offers optional auto-renewable subscriptions and a lifetime purchase ("Deeper Sky") processed through Apple's App Store and Google Play. Payment is charged to your Apple ID or Google account at confirmation of purchase. Subscriptions automatically renew unless cancelled at least 24 hours before the end of the current period. You can manage or cancel subscriptions in your device settings. MySky does not directly collect or store payment information — all transactions are handled by Apple or Google.

## 10. Changes to This Policy

We may update this Privacy Policy from time to time. When we make material changes, the "Last updated" date at the top of this page will be revised, and — if the change affects how your data is processed — we will re-request your privacy consent within the app. Continued use of MySky after a policy update constitutes acceptance of the revised terms.

## 11. Contact Us

If you have questions or concerns about this Privacy Policy or your data, please contact:

**Email:** [brittanyapps@outlook.com](mailto:brittanyapps@outlook.com)

We respond to privacy-related inquiries within 30 days.
