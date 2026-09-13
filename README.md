# 🔐 Encrypted Privacy Vault

A privacy-first web application designed to securely store and manage sensitive files using **client-side encryption**. The project combines the **Web Crypto API** with a secure **Node.js + Express.js backend** to provide protected file handling and a security-focused user experience.

## 🚀 Features

* 🔒 **Client-Side Encryption** using the Web Crypto API
* 📁 Secure file upload and management
* 🛡️ Protected API endpoints
* 🚦 Rate limiting to prevent abuse
* ✅ Input validation and secure request handling
* 🧹 Automated cleanup of temporary/unwanted files
* ⚡ Modular and scalable Express.js architecture
* 📱 Responsive and user-friendly interface

## 🛠️ Tech Stack

### Frontend

* HTML
* CSS
* TypeScript
* Web Crypto API

### Backend

* Node.js
* Express.js
* TypeScript

### Security

* Client-side encryption
* Rate limiting
* Protected file uploads
* Input validation
* Automated file cleanup

## 🏗️ Project Architecture

```text
Client
  │
  │ Encrypted Requests
  ▼
Express.js API
  │
  ├── Controllers
  ├── Middleware
  ├── Validation
  └── Rate Limiting
  │
  ▼
Secure File Handling
```


## 🔐 Security

Security is a core focus of this project.

The application uses the **Web Crypto API** to perform cryptographic operations on the client side. Additional backend protections include:

* Rate limiting
* Input validation
* Protected file uploads
* Secure API middleware
* Temporary file cleanup
* Separation of application responsibilities

> **Note:** This project is intended for educational and demonstration purposes. Production deployment should include additional security auditing, secure key management, HTTPS, authentication hardening, logging/monitoring, and infrastructure-level protections.

## 📂 Project Structure

```text
src/
├── controllers/
├── middleware/
├── routes/
├── services/
├── utils/
└── server.ts
```

> Update this structure to match your actual project folders.

## 🎯 Learning Objectives

This project was built to explore:

* Web-based cryptography
* Secure file handling
* REST API development
* Express.js architecture
* TypeScript backend development
* Middleware design
* Application security
* Privacy-focused application development

## 🔮 Future Improvements

* User authentication and authorization
* Multi-factor authentication
* Password-based key derivation
* Secure cloud storage integration
* File sharing with encrypted access
* Security audit and penetration testing
* Improved key management
* Database integration

## 👨‍💻 Author

**ABHIMANYU KHAMARU**

* GitHub: `https://github.com/abhimanyu64`
* LinkedIn: `https://linkedin.com/in/abhimanyu-khamaru`
