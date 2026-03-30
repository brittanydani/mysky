# Privacy Policy for MySky

**Last updated: March 30, 2026**

## Data Controller

MySky is developed and operated by Brittany Apps ("we," "us," or "our"). For questions or requests regarding your personal data, contact us at [brittanyapps@outlook.com](mailto:brittanyapps@outlook.com).

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

## 2. Legal Basis for Processing (GDPR)

We process your personal data under the following legal bases:

- **Consent (Art. 6(1)(a) GDPR):** We collect and process your personal data only after you provide explicit consent via the in-app privacy consent flow. You may withdraw consent at any time via Privacy Settings.
- **Performance of a Contract (Art. 6(1)(b) GDPR):** When you subscribe to Deeper Sky, we process subscription-related data (via Apple and RevenueCat) to fulfill our contractual obligations.
- **Legitimate Interest (Art. 6(1)(f) GDPR):** We maintain security audit logs and tamper detection to protect the integrity of your locally stored data.

### Special Category Data

Certain data you may enter — such as emotional states, somatic body sensations, nervous system triggers, and psychological self-assessments — may constitute special category data under GDPR Article 9. We process this data solely on the basis of your explicit consent and store it exclusively on your device with AES-256-GCM encryption. This data is never transmitted to any server.

## 3. Data Security

### Encryption at Rest

Sensitive fields — journal content, titles, birth places, dream text, mood/stress/energy scores, emotional tags, check-in notes, wins, challenges, and NLP results — use AES-256-GCM field-level encryption. The data encryption key is stored in your device's hardware-backed SecureStore (iOS Keychain).

### Tamper Detection

SecureStore payloads are protected with HMAC-SHA256 tamper detection using a device-unique key. Security events are logged in a rolling audit trail for your transparency.

### Backup Encryption

Encrypted .msky backups use AES-256-GCM with PBKDF2-SHA256 key derivation (100,000 iterations) from your chosen passphrase. Backups are never uploaded to any server — you control where they go via your device's share sheet.

## 4. Third-Party Services

- **RevenueCat:** Device identifier generated by the RevenueCat SDK for subscription and in-app purchase verification. No personal data is shared. No explicit user identifiers are set by MySky.
- **OpenStreetMap Nominatim:** Birth city text sent for geocoding to coordinates. Only the city name string is transmitted.
- **Supabase:** Account creation (email/password) required for AI Reflection Insights. Session tokens stored in device secure storage. Supabase servers are located in the United States.
- **Anthropic Claude:** AI Reflection Insights via Supabase Edge Function. Receives only aggregated behavioral stats — never raw text, birth data, or personal notes. API key lives exclusively in the Edge Function environment. Anthropic servers are located in the United States.
- **Google Gemini:** AI-enhanced dream interpretations and pattern insights. Dream text and feelings are sent for dream interpretations. Aggregated self-knowledge context (archetype, values, cognitive style, somatic patterns, relationship patterns, and check-in averages) is sent for pattern insights. No birth data, user identifiers, or raw journal text is transmitted. API key is stored as an environment variable in the app bundle. Google servers may be located in the United States or other countries.
- **Apple App Store:** Processes all subscription and in-app purchase transactions. MySky does not directly collect or store any payment card or billing information.

## 5. International Data Transfers

When you use optional AI-powered features, limited data is transmitted to servers located in the United States (Supabase, Anthropic) and potentially other countries (Google). These transfers are necessary to provide the requested service and are made on the basis of your explicit consent. We ensure that third-party providers maintain appropriate data protection standards. All transmitted data is limited to the minimum necessary — no raw personal content, birth data, or identifying information is included.

For users in the European Economic Area (EEA), United Kingdom, or Switzerland: data transfers to the United States rely on your explicit consent under GDPR Article 49(1)(a) and, where available, the service providers' adherence to Standard Contractual Clauses (SCCs) or equivalent safeguards.

## 6. No Tracking

MySky declares NSPrivacyTracking: false with an empty tracking domains list. No analytics SDKs (no Firebase, Amplitude, Mixpanel, Sentry, or Crashlytics) are included. No advertising identifiers are collected.

## 7. Apple Privacy Manifest

Data types declared in our Apple Privacy Manifest:

- **Coarse Location:** For timezone resolution via on-device tz-lookup (not GPS tracking).
- **User ID:** For optional Supabase authentication only.
- **Purchases:** For RevenueCat subscription verification.

All data types are declared as not linked to identity and not used for tracking.

## 8. Cookies and Local Storage

MySky does not use cookies, web beacons, or browser-based tracking technologies. All data is stored in a local SQLite database and the device's SecureStore (iOS Keychain). No web-based session tracking occurs.

## 9. Automated Decision-Making

MySky does not engage in automated decision-making or profiling that produces legal effects or similarly significant effects on users. All reflective content, pattern analysis, and interpretations are provided for self-awareness purposes only and carry no binding or consequential effect.

## 10. Your Rights

Under GDPR, CCPA/CPRA, and applicable privacy law, you have the following rights over your personal data:

### Right of Access

View all data MySky holds about you at any time via Privacy Settings, including a full data inventory, consent status, and recent security events.

### Right to Data Portability

Export your complete data as a structured, machine-readable JSON archive via Privacy Settings, or as an encrypted .msky backup from the Settings tab (premium).

### Right to Erasure ("Right to Be Forgotten")

Delete all personal data at any time using the "Hard Reset" option in Privacy Settings. This permanently erases all data from SQLite and SecureStore with best-effort secure deletion. Uninstalling the app also erases all locally stored data. If you created a Supabase account, you may request deletion of your authentication credentials by contacting us.

### Right to Rectification

Update your birth data, edit or delete journal entries, modify sleep logs, and manage relationship charts at any time directly within the app.

### Right to Withdraw Consent

Withdraw your data processing consent at any time via Privacy Settings. Existing data is preserved but no new personal data will be collected until consent is restored. Withdrawal of consent does not affect the lawfulness of processing based on consent before its withdrawal.

### Right to Restrict Processing

Since all core processing happens on-device, you control it entirely. Withdrawing consent blocks all data writes until consent is restored.

### Right to Object

You have the right to object to data processing based on legitimate interest. Since MySky processes nearly all data on-device under your explicit consent, this right is effectively exercised by withdrawing consent in Privacy Settings.

### Right to Lodge a Complaint

If you believe your data protection rights have been violated, you have the right to lodge a complaint with a supervisory authority. For users in the EEA, you may contact the data protection authority in your country of residence. A list of EEA data protection authorities is available at https://edpb.europa.eu.

### Right of Non-Discrimination

We will not discriminate against you for exercising any of your privacy rights. Exercising your rights will not affect the quality or availability of the service.

## 11. California Privacy Rights (CCPA/CPRA)

If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA) as amended by the California Privacy Rights Act (CPRA):

### Categories of Personal Information Collected

- **Identifiers:** Email address (only if you create an optional account).
- **Personal records:** Birth date, birth time, birth place (stored locally and encrypted).
- **Characteristics of protected classifications:** Not collected.
- **Commercial information:** Subscription status (managed by Apple and RevenueCat).
- **Internet or network activity:** Not collected. No analytics or tracking SDKs.
- **Geolocation data:** Coarse location (timezone only, via on-device lookup).
- **Sensory data:** Not collected.
- **Professional or employment information:** Not collected.
- **Education information:** Not collected.
- **Inferences:** On-device pattern analysis for self-reflection; never transmitted.
- **Sensitive personal information:** Emotional states, somatic data, psychological self-assessments (stored locally and encrypted; never transmitted except aggregated stats for opted-in AI features).

### Sale and Sharing of Personal Information

MySky does **not** sell your personal information. MySky does **not** share your personal information for cross-context behavioral advertising. We have not sold or shared personal information in the preceding 12 months.

### Right to Know

You may request a copy of the personal information we have collected about you. Since all data is stored locally on your device, you can access it directly via Privacy Settings.

### Right to Delete

You may request deletion of your personal information. Use the "Hard Reset" option in Privacy Settings for immediate local deletion. For account data, contact us at brittanyapps@outlook.com.

### Right to Correct

You may request correction of inaccurate personal information at any time by editing your data within the app.

### Right to Limit Use of Sensitive Personal Information

MySky uses sensitive personal information only for the purpose of providing the app's self-reflection features. No sensitive data is used for advertising, profiling, or any secondary purpose.

## 12. Data Retention

Your data is stored locally on your device for as long as you keep the app installed. Consent records expire after 365 days and will be re-requested. There is no server-side storage of personal data beyond optional Supabase authentication credentials. If you delete your account, authentication data is removed from Supabase within 30 days.

## 13. Children's Privacy

MySky is intended for users aged 17 and older. We do not knowingly collect personal information from children under 17. If we learn we have inadvertently collected data from a user under 17, we will take steps to delete that data promptly. If you are a parent or guardian and believe your child has provided personal information through the app, please contact us immediately.

## 14. Subscriptions & Payments

MySky offers optional auto-renewable subscriptions and a lifetime purchase ("Deeper Sky") processed through Apple's App Store. Payment is charged to your Apple ID at confirmation of purchase. Subscriptions automatically renew unless cancelled at least 24 hours before the end of the current period. You can manage or cancel subscriptions in your device settings. MySky does not directly collect or store payment information — all transactions are handled by Apple.

## 15. Data Breach Notification

In the unlikely event of a data breach affecting your personal information held on our servers (Supabase authentication data), we will notify affected users within 72 hours of becoming aware of the breach, in accordance with GDPR Article 33 and applicable law. Because the vast majority of your data is stored exclusively on your device and never transmitted, the risk of a server-side breach affecting personal content is extremely limited.

## 16. Changes to This Policy

We may update this Privacy Policy from time to time. When we make material changes, the "Last updated" date at the top of this page will be revised, and — if the change affects how your data is processed — we will re-request your privacy consent within the app. Continued use of MySky after a policy update constitutes acceptance of the revised terms. We encourage you to review this page periodically.

## 17. Contact Us

If you have questions or concerns about this Privacy Policy or your data, please contact:

**Email:** [brittanyapps@outlook.com](mailto:brittanyapps@outlook.com)

We respond to privacy-related inquiries within 30 days.
