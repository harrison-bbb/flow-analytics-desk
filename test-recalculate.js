// Test script to recalculate user metrics
const response = await fetch('https://usudyoxblzruwzowcets.supabase.co/functions/v1/recalculate-user-metrics', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzdWR5b3hibHpydXd6b3djZXRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MjMwOTIsImV4cCI6MjA3MjA5OTA5Mn0.8wh-E9cp1KO5mzqsO-2jFqq946o-hBq4bTnJ_ST21PQ'
  },
  body: JSON.stringify({
    user_id: '2990981f-f015-4beb-96aa-83ae12e24258'
  })
});

const result = await response.json();
console.log('Recalculation result:', result);