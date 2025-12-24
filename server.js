require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const OpenAI = require('openai');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI);

const UserSchema = new mongoose.Schema({name:String,email:{type:String,unique:true},profile:String});
const ExpenseSchema = new mongoose.Schema({userId:String,item:String,amount:Number,date:String});
const User = mongoose.model('User', UserSchema);
const Expense = mongoose.model('Expense', ExpenseSchema);

const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

// REGISTER (Login save)
app.post('/api/register', async (req,res)=>{
  try{
    const {name,email,profile} = req.body;
    let user = await User.findOne({email});
    if(!user){
      user = new User({name,email,profile});
      await user.save();
    }
    res.json({userId:user._id,name,profile});
  }catch(e){res.status(500).json({error:e.message})}
});

// EXPENSES
// 🔥 ADD THIS ROOT ROUTE (BEFORE other routes)
app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 FinGuide API Live!', 
    status: '✅ OK',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/expenses/:userId', async (req,res)=>{
  const expense = new Expense({...req.body,userId:req.params.userId});
  await expense.save();
  res.json({success:true});
});

app.delete('/api/expenses/:userId', async (req,res)=>{
  await Expense.deleteMany({userId:req.params.userId});
  res.json({success:true});
});

// AI POCKET MONEY ANALYZER
app.post('/api/ai-analyze/:userId', async (req,res)=>{
  try{
    const {rawExpenses} = req.body;
    const completion = await openai.chat.completions.create({
      model:"gpt-3.5-turbo",
      messages:[{role:"user", content:`Convert expenses "${rawExpenses}" to budget table HTML with Category,Amount,%,Tips columns. Return ONLY table HTML.`}],
      max_tokens:800
    });
    res.json({analysis: completion.choices[0].message.content});
  }catch(e){res.status(500).json({error:e.message})}
});

app.listen(process.env.PORT||3000,()=>console.log('🚀 Server ON!'));

