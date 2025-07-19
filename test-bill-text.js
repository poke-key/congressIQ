const CONGRESS_API_KEY = 'eXAvKCf6ywYmDbLc5TvgvF3ulEKj98u80ZWkhyvZ';
const CONGRESS_API_BASE_URL = 'https://api.congress.gov/v3';

async function testBillText() {
  try {
    // Test with the example bill from the documentation
    const url = `${CONGRESS_API_BASE_URL}/bill/117/hr/3076/text?api_key=${CONGRESS_API_KEY}&format=json`;
    
    console.log('🔍 Testing bill text endpoint...');
    console.log('URL:', url);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'CongressIQ/1.0',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('\n📄 Full API Response:');
    console.log(JSON.stringify(data, null, 2));
    
    // Check for .htm URLs specifically
    if (data.textVersions) {
      console.log('\n🔍 Checking for .htm URLs...');
      data.textVersions.forEach((version, index) => {
        console.log(`\n📋 Text version ${index + 1}:`);
        console.log(`   Type: ${version.type}`);
        console.log(`   Date: ${version.date}`);
        
        if (version.formats) {
          console.log(`   Formats (${version.formats.length}):`);
          version.formats.forEach((format, formatIndex) => {
            console.log(`     ${formatIndex + 1}. ${format.type}: ${format.url}`);
            if (format.url && format.url.includes('.htm')) {
              console.log(`        ✅ FOUND .HTM URL: ${format.url}`);
            }
          });
        }
      });
    } else {
      console.log('\n❌ No textVersions found in response');
    }
    
  } catch (error) {
    console.error('❌ Error testing bill text:', error);
  }
}

testBillText(); 