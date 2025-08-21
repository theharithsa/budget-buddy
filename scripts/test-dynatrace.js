#!/usr/bin/env node

// Test script to verify Dynatrace build event ingestion
const DYNATRACE_ENDPOINT = process.env.DYNATRACE_ENDPOINT || 'https://bos01241.live.dynatrace.com/platform/ingest/custom/events/finbuddy';
const DYNATRACE_TOKEN = process.env.DYNATRACE_TOKEN || process.env.DYNATRACE_API_TOKEN;

// Validate required environment variables
if (!DYNATRACE_TOKEN) {
  console.error('❌ DYNATRACE_TOKEN environment variable is required');
  console.error('   Set DYNATRACE_TOKEN or DYNATRACE_API_TOKEN environment variable');
  console.error('   Example: export DYNATRACE_TOKEN="dt0c01.YOUR_TOKEN_HERE"');
  process.exit(1);
}

async function testDynatraceConnection() {
  const testEvent = {
    source: "finbuddy",
    "event.id": Date.now(),
    "event.type": "test",
    "test.timestamp": new Date().toISOString(),
    "test.message": "Testing Dynatrace build event ingestion",
    "project.name": "finbuddy",
    "environment": "test"
  };

  try {
    console.log('🧪 Testing Dynatrace connection...');
    console.log('📡 Endpoint:', DYNATRACE_ENDPOINT);
    console.log('📦 Test event:', JSON.stringify(testEvent, null, 2));

    const response = await fetch(DYNATRACE_ENDPOINT, {
      method: 'POST',
      headers: {
        'accept': '*/*',
        'Authorization': `Api-Token ${DYNATRACE_TOKEN}`,
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify([testEvent])
    });

    if (response.ok) {
      console.log('✅ Test event sent to Dynatrace successfully!');
      const responseText = await response.text();
      if (responseText) {
        console.log('📄 Response:', responseText);
      }
      console.log('🎉 Dynatrace integration is working correctly');
    } else {
      console.error('❌ Failed to send test event to Dynatrace');
      console.error('📊 Status:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('📝 Error details:', errorText);
    }
  } catch (error) {
    console.error('❌ Error testing Dynatrace connection:', error);
  }
}

testDynatraceConnection();
