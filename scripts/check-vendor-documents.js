// Script to check which vendors have verification documents
import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env.local file
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envLines = envContent.split('\n');

let MONGODB_URI = '';
for (const line of envLines) {
  if (line.startsWith('MONGODB_URI=')) {
    MONGODB_URI = line.replace('MONGODB_URI=', '').trim();
    break;
  }
}

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env.local');
  process.exit(1);
}

async function checkVendorDocuments() {
  let client;
  
  try {
    console.log('🔍 Checking vendor verification documents...\n');

    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db();
    const vendorsCollection = db.collection('vendors');
    const usersCollection = db.collection('users');

    // Get all vendors with their document status
    const vendors = await vendorsCollection.find({}).toArray();

    if (vendors.length === 0) {
      console.log('❌ No vendors found in the database.');
      return;
    }

    console.log(`📊 Total Vendors: ${vendors.length}\n`);
    console.log('═'.repeat(100));

    // Statistics
    let stats = {
      total: vendors.length,
      withIdentityDocs: 0,
      withBusinessDocs: 0,
      withBothDocs: 0,
      withNoDocs: 0,
      verified: 0,
      pending: 0,
      active: 0,
      suspended: 0,
      inactive: 0
    };

    // Check each vendor
    for (const vendor of vendors) {
      // Get user details
      const user = await usersCollection.findOne({ _id: vendor.user });
      
      const hasIdentityDoc = !!vendor.documents?.identity?.docImageUrl;
      const hasBusinessDoc = !!vendor.documents?.business?.docImageUrl;
      
      // Update statistics
      if (hasIdentityDoc) stats.withIdentityDocs++;
      if (hasBusinessDoc) stats.withBusinessDocs++;
      if (hasIdentityDoc && hasBusinessDoc) stats.withBothDocs++;
      if (!hasIdentityDoc && !hasBusinessDoc) stats.withNoDocs++;
      if (vendor.verified?.isVerified) stats.verified++;
      
      // Status stats
      if (vendor.status === 'pending') stats.pending++;
      if (vendor.status === 'active') stats.active++;
      if (vendor.status === 'suspended') stats.suspended++;
      if (vendor.status === 'inactive') stats.inactive++;

      // Display vendor information
      console.log(`\n📋 Vendor: ${vendor.businessName}`);
      console.log(`   ID: ${vendor._id}`);
      console.log(`   Contact: ${user?.name || 'N/A'} (${user?.phone || 'N/A'})`);
      console.log(`   Email: ${user?.email || 'N/A'}`);
      console.log(`   Status: ${vendor.status}`);
      console.log(`   Verified: ${vendor.verified?.isVerified ? '✅ Yes' : '❌ No'}`);
      
      console.log('\n   Documents:');
      
      // Identity Document
      if (hasIdentityDoc) {
        console.log(`   ✅ Identity Document:`);
        console.log(`      Type: ${vendor.documents.identity.type || 'Not specified'}`);
        console.log(`      Number: ${vendor.documents.identity.number || 'Not provided'}`);
        console.log(`      URL: ${vendor.documents.identity.docImageUrl}`);
      } else {
        console.log(`   ❌ Identity Document: Not uploaded`);
      }
      
      // Business Document
      if (hasBusinessDoc) {
        console.log(`   ✅ Business Document:`);
        console.log(`      Type: ${vendor.documents.business.type || 'Not specified'}`);
        console.log(`      Number: ${vendor.documents.business.number || 'Not provided'}`);
        console.log(`      URL: ${vendor.documents.business.docImageUrl}`);
      } else {
        console.log(`   ❌ Business Document: Not uploaded`);
      }

      // Document completion
      const totalDocs = 2;
      const uploadedDocs = (hasIdentityDoc ? 1 : 0) + (hasBusinessDoc ? 1 : 0);
      const completionPercentage = Math.round((uploadedDocs / totalDocs) * 100);
      console.log(`\n   📈 Document Completion: ${completionPercentage}% (${uploadedDocs}/${totalDocs} documents)`);
      
      console.log('─'.repeat(100));
    }

    // Display summary statistics
    console.log('\n\n📊 SUMMARY STATISTICS');
    console.log('═'.repeat(100));
    console.log(`\n📌 Total Vendors: ${stats.total}`);
    console.log(`\n📄 Document Upload Status:`);
    console.log(`   ✅ With Identity Documents: ${stats.withIdentityDocs} (${Math.round(stats.withIdentityDocs/stats.total*100)}%)`);
    console.log(`   ✅ With Business Documents: ${stats.withBusinessDocs} (${Math.round(stats.withBusinessDocs/stats.total*100)}%)`);
    console.log(`   ✅ With Both Documents: ${stats.withBothDocs} (${Math.round(stats.withBothDocs/stats.total*100)}%)`);
    console.log(`   ❌ With No Documents: ${stats.withNoDocs} (${Math.round(stats.withNoDocs/stats.total*100)}%)`);
    
    console.log(`\n🔐 Verification Status:`);
    console.log(`   ✅ Verified: ${stats.verified}`);
    console.log(`   ⏳ Not Verified: ${stats.total - stats.verified}`);
    
    console.log(`\n📊 Vendor Status:`);
    console.log(`   ⏳ Pending: ${stats.pending}`);
    console.log(`   ✅ Active: ${stats.active}`);
    console.log(`   🚫 Suspended: ${stats.suspended}`);
    console.log(`   💤 Inactive: ${stats.inactive}`);
    
    console.log('\n═'.repeat(100));
    console.log('\n✅ Document check completed!\n');

  } catch (error) {
    console.error('❌ Error checking vendor documents:', error);
    throw error;
  } finally {
    // Close database connection
    if (client) {
      await client.close();
      console.log('🔌 Database connection closed');
    }
    process.exit(0);
  }
}

// Run the script
checkVendorDocuments();
