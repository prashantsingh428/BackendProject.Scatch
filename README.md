# Scatch - Elevate Your Style & Personal Wardrobe

![Scatch Homepage](public/images/scatch_homepage.png)

**Scatch** is a premium, full-stack E-commerce platform designed to simplify fashion choices and elevate the shopping experience. Built with a focus on performance, security, and a seamless user interface, Scatch provides a robust solution for modern fashion retail.

---

## 🚀 Key Features

### 🛒 Seamless Shopping Experience
- **Advanced Product Filtering**: filter by category, brand, and price range to find exactly what you're looking for.
- **Dynamic Sorting**: Sort products by popularity, newest arrivals, or price (low to high/high to low).
- **Infinite Shopping**: A smooth, responsive interface showcasing collections like "Flash Deals", "Today's For You", and "Elegant Fashion".

### 👤 Personalized User Management
- **User Accounts**: Detailed user profiles with the ability to update personal information and profile pictures.
- **Wishlist & Cart**: Save your favorites for later or manage your current shopping selections with ease.
- **Order Tracking**: Keep track of your fashion journey.

### 🔐 Security & Reliability
- **Secure Authentication**: Implementation of **JWT (JSON Web Tokens)** for robust session management.
- **Data Protection**: Industry-standard password hashing using **Bcrypt**.
- **Admin Control**: Dedicated owner/admin dashboard for product and platform management.

---

## 🛠️ Tech Stack

### Frontend
- **EJS (Embedded JavaScript)**: Server-side rendering for fast, dynamic page generation.
- **Vanilla CSS**: Custom-crafted styles for a unique, premium "glassmorphic" aesthetic.
- **Google Fonts**: Modern typography (Inter, Outfit) for enhanced readability.

### Backend
- **Node.js & Express.js**: High-performance and scalable server architecture.
- **MongoDB & Mongoose**: Flexible NoSQL database with elegant object modeling.

### Core Utilities
- **Multer**: Efficient handling of product image uploads.
- **JWT & Bcrypt**: Foundations of our security architecture.
- **Connect-flash**: Real-time user feedback for a responsive feel.

---

## 🏁 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v14+)
- [MongoDB](https://www.mongodb.com/) (Local or Atlas)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/prashantsingh428/BackendProject.Scatch.git
   cd BackendProject.Scatch
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Configuration:**
   Create a `.env` file in the root directory:
   ```env
   MONGO_URI=your_mongodb_connection_string
   JWT_KEY=your_secret_key
   ```

4. **Initialize Admin (Owner):**
   ```bash
   node setup_owner.js
   ```

5. **Run the application:**
   ```bash
   npm start
   ```

---

*Developed with passion for premium fashion by [Prashant Singh](https://github.com/prashantsingh428)*
