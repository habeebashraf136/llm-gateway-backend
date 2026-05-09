import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const apikeySchema = new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true,
    },
    apikey:{
        type:String,
        required:true,
        unique:true,
    },
    reqCount:{
        type:Number,
        default:0,
    },
    token:{
        type:Number,
        default:10000,
    },
},{timestamps:true})

apikeySchema.index({ user: 1 });

apikeySchema.pre('save',async function() {
    if (!this.isModified('apikey')) return;
    this.apikey = await bcrypt.hash(this.apikey, 10);
})

apikeySchema.methods.compareApikey = async function(candidateApikey) {
    return await bcrypt.compare(candidateApikey, this.apikey);
}

const apikeyModel = mongoose.model('Apikey', apikeySchema);

export default apikeyModel;