import fetch from 'node-fetch';

async function testEmployeeRegistration() {
  try {
    const response = await fetch('http://localhost:3000/api/auth/employee/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: "Test Employee",
        email: "test.employee@royalcauveryfarms.com",
        password: "testpassword123",
        phone: "9876543210",
        address: "123 Test Street",
        pincode: "560001",
        guardianName: "Test Guardian",
        dateOfBirth: "1990-01-01",
        gender: "MALE",
        pancardNumber: "ABCDE1234F",
        aadharCardNumber: "123456789012",
        bankName: "Test Bank",
        bankBranch: "Test Branch",
        accountNumber: "123456789",
        ifscCode: "TEST0001234",
        employeeRole: "FIELD_OFFICER"
      }),
    });

    const data = await response.json();
    console.log('Registration Response:', data);
    
    if (data.user?.employeeId) {
      console.log('Generated Employee ID:', data.user.employeeId);
      // Verify the format: Should be RCF2025XXX
      const idFormat = /^RCF\d{4}\d{3}$/;
      if (idFormat.test(data.user.employeeId)) {
        console.log('✅ Employee ID format is correct');
      } else {
        console.log('❌ Employee ID format is incorrect');
      }
    }
  } catch (error) {
    console.error('Error testing employee registration:', error);
  }
}

// Run the test
testEmployeeRegistration();
