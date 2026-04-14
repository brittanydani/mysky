const fs = require('fs');
let content = fs.readFileSync('/Users/brittany/Downloads/mysky/app/(tabs)/chart.tsx', 'utf8');

content = content.replace(
  /<Text style=\{styles\.themedCardSummary\} numberOfLines=\{expandedLifeTheme === 'relationship' \? undefined : 2\}>\{relationshipProfile\.synthesis\}<\/Text>/,
  `{!expandedLifeTheme || expandedLifeTheme !== 'relationship' ? (
                        <Text style={styles.themedCardSummary} numberOfLines={2}>{relationshipProfile.synthesis}</Text>
                      ) : null}`
);

content = content.replace(
  /<Text style=\{styles\.themedCardSummary\} numberOfLines=\{expandedLifeTheme === 'career' \? undefined : 2\}>\{careerProfile\.synthesis\}<\/Text>/,
  `{!expandedLifeTheme || expandedLifeTheme !== 'career' ? (
                        <Text style={styles.themedCardSummary} numberOfLines={2}>{careerProfile.synthesis}</Text>
                      ) : null}`
);

content = content.replace(
  /<Text style=\{styles\.themedCardSummary\} numberOfLines=\{expandedLifeTheme === 'emotional' \? undefined : 2\}>\{emotionalProfile\.synthesis\}<\/Text>/,
  `{!expandedLifeTheme || expandedLifeTheme !== 'emotional' ? (
                        <Text style={styles.themedCardSummary} numberOfLines={2}>{emotionalProfile.synthesis}</Text>
                      ) : null}`
);

content = content.replace(
  /<Text style=\{styles\.themedCardSummary\} numberOfLines=\{expandedLifeTheme === 'shadow' \? undefined : 2\}>\{shadowGrowth\.synthesis\}<\/Text>/,
  `{!expandedLifeTheme || expandedLifeTheme !== 'shadow' ? (
                        <Text style={styles.themedCardSummary} numberOfLines={2}>{shadowGrowth.synthesis}</Text>
                      ) : null}`
);

fs.writeFileSync('/Users/brittany/Downloads/mysky/app/(tabs)/chart.tsx', content);
