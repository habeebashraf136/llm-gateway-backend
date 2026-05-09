import mongoose from 'mongoose';


const messageSchema = new mongoose.Schema({
    chat:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Chat',
        required:true,
    },
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true,
    },
    content:{
        type:String,
        required:true,
    },
    role:{
        type:String,
        required:true,
        enum:['user','assistant']
    },
    type:{
        type:String,
        enum:['fast','creative','coding'],
        required:true,
    },
    provider:{
        type:String,
        required:true,
    },
    model:{
        type:String,
        required:true,
    },
    tokenUsed:{
        type:Number,
        required:true
    },
    isFallback:{
        type:Boolean,
        required:true,
        default:false,
    },
    isStreamed:{
        type:Boolean,
        required:true,
        default:false,
    }
},{timestamps:true})

messageSchema.index({ chat: 1, createdAt: 1 });

const messageModel = mongoose.model('Message', messageSchema);

export default messageModel;
