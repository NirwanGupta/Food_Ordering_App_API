const mongoose = require(`mongoose`);
const validator = require(`validator`);
const bcrypt = require(`bcryptjs`);

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: [true, "Provide your name"],
        maxlength: 30,
        minlength: 3,
    },
    password: {
        type: String,
        required: [true, "Enter your passwprd"],
        minlength: 8,
    },
    email: {
        type: String,
        required: [true, "Please provide valid email"],
        validate: {
            validator: validator.isEmail,
            message: "Please provide a valid email",
        },
        unique: true,
    },
    address: {
        type: String,
        required: [true, "Please provide address"],
    },
    phone: {
        type: String,
        required: [true, 'Please provide a phone number'],
        validate: {
            validator: function(value) {
                return this.phone.length === 10 && !isNaN(this.phone);
            },
            message: "Please enter a valid phone number",
        },
    },
    role: {
        type: String,
        enum: ['admin','user'],
    },
    verificationToken: String,
    isVerified: {
        type: Boolean,
        default: false,
    },
    verified: Date,
    passwordToken: {
        type: String,
    },
    passwordTokenExpirationDate: {
        type: Date,
    },
},{timestamps: true});

userSchema.pre(`save`, async function() {
    // console.log("password register: ", this.password);
    if(!this.isModified('password'))    return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    // console.log(candidatePassword);
    // console.log(this.password);
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    // console.log(isMatch);
    return isMatch;
};

module.exports = mongoose.model('User', userSchema);