import mongoose from 'mongoose';

const { Schema } = mongoose;

const vendorLogsSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    type: {
        type: String,
        enum: ['lead', 'subscription'],
        required: true
    },

    leadId: {
        type: Schema.Types.ObjectId,
        ref: 'Lead',
        required: false
    },
    
    subscriptionId: {
        type: Schema.Types.ObjectId,
        ref: 'Subscription',
        required: false
    },
    
    time:{
        type: Date,
        required: true,
        default: Date.now
    }
    
});

const VendorLogs = mongoose.model('vendorlogs', vendorLogsSchema);

export default VendorLogs;