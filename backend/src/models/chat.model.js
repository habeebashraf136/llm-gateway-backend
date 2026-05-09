import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true,
    },
    apikeyid:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Apikey',
        required:true,
    },
    title:{
        type:String,
        required:true,
    },
    type:{
        type:String,
        enum:['fast','creative','coding'],
        required:true,
    },
    model:{
        type:String,
        required:true,
    },
    messageCount:{
        type:Number,
        default:0,
    }
},{timestamps:true})

chatSchema.index({ user: 1, updatedAt: -1 });

const chatModel = mongoose.model('Chat', chatSchema);

export default chatModel;