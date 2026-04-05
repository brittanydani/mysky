import { Redirect } from 'expo-router';

// Insights content was merged into the Patterns tab. Keep legacy tab routes valid.
export default function InsightsTabRedirect() {
	return <Redirect href="/(tabs)/patterns" />;
}
