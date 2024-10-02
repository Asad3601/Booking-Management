const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    first_name: {
        type: String,
        required: true,
        maxlength: 50,
        match: [/^[a-zA-Z\s\-]+$/, 'First Name can only contain alphabets, spaces, and hyphens']
    },
    last_name: {
        type: String,
        required: true,
        maxlength: 50,
        match: [/^[a-zA-Z\s\-]+$/, 'Last Name can only contain alphabets, spaces, and hyphens']
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
        match: [/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, 'Password must contain at least 8 characters, including alphabets, numbers, and special characters']
    },
    image: {
        type: String,
        default: 'user.png'
    },
    role: {
        type: String,
        default: 'user',
        enum: ['user', 'admin']
    },
    otp: {
        type: String,
    },

}, {
    timestamps: true
});

const UserModel = mongoose.model('User', userSchema);

module.exports = UserModel;