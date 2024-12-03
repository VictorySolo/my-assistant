const mongoose = require("mongoose")
const { Schema } = mongoose

// define regex validation pattern for email and phone
const validationPatterns = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, // Basic email format
    phone: /^05\d{8}$/, // phone number 05xxxxxxxx
}

// addressSchema
const addressSchema = new Schema({
    country: { type: String, required: [true, "Country is required"], trim: true },
    city: { type: String, required: [true, "City is required"], trim: true },
    street: { type: String, required: [true, "Street is required"], trim: true },
    building: { type: Number, required: [true, "Building number is required"] },
});

// UserSchema
const userSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: [true, "Email has to be unique"],
            lowercase: true,
            trim: true,
            validate: {
                validator: (value) => validationPatterns.email.test(value),
                message: "Invalid email address.",
            },
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [8, "Password must be at least 8 characters long"],
            trim: true,
        },
        phone: {
            type: String,
            required: [true, "Phone number is required"],
            trim: true,
            validate: {
                validator: (value) => validationPatterns.phone.test(value),
                message: "Invalid phone numberformat. Must be 05xxxxxxxx."
            },
        },
        address: {
            type: addressSchema,
            required: [true, "Address is required"],
        },
        services: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Service",
                default: [],
            }
        ],
        schedule: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Schedule",
            default: [],
        }],
        isAdmin: { 
            type: Boolean,
            default: false, 
            required: [true, "Admin status is required"], 
        },
    }
)

const User = mongoose.model("User", userSchema)
module.exports = User