# Hello👋
    "dev": "nodemon backend/app.ts",
    "start": "npm start",


[POSTMAN API's](https://web.postman.co/workspace/d3724ad9-fd9f-4ff6-8a08-9fb3e31ddf95/documentation/16474019-6cf4214d-dbf5-4a87-aa04-ce934414318a)


Here’s a clean and professional structure for your **Expenses Tracker Documentation**. This format will help stakeholders, developers, and designers clearly understand your application.

---

### **1. Product Requirements**

* **Objective**: Track personal and group expenses effectively.
* **Target Users**: Individuals and groups (e.g., roommates, trip members).
* **Core Features**:

  * User authentication (email/Google)
  * Create and manage expense groups
  * Add, edit, and delete expenses
  * Split expenses among members
  * Track total paid/owed per user
  * Group chat (optional)
  * View expense history

---

### **2. UI/UX Design**

* **Design Goals**:

  * Simple and intuitive interface
  * Mobile-first responsive design
* **Key Screens**:

  * Login / Register
  * Dashboard (Your Groups, Joined Groups, Invites)
  * Create Group
  * Group Details (Members, Expenses, Stats)
  * Add/Edit Expense
  * Chat (optional)

---

### **3. Software Architecture**

* **Frontend**:

  * React Native (Expo)
  * State Management: Context API / Redux (if needed)
* **Backend**:

  * Node.js with Express
  * MongoDB (Mongoose ORM)
* **Auth**:

  * JWT + Google OAuth
* **File Uploads**:

  * Group image upload using Multer or Cloud storage
* **Push Notifications**: (Optional, via Expo or FCM)

---

### **4. Technical Design**

* **Database Models**:

  * **User**: name, email, profileImage, joinedGroups, etc.
  * **Group**: name, groupImage, members, createdBy
  * **Expense**: amount, description, paidBy, splitBetween, groupId
  * **Invitation**: sender, receiver, status, groupId
* **Services**:

  * Auth Service
  * Group Service
  * Expense Service
  * Notification Service (if used)
* **Security**:

  * Input validation (Zod/Yup)
  * Role-based access for groups

---

### **5. API Documentation**

* **Auth APIs**

  * `POST /auth/register`
  * `POST /auth/login`
  * `POST /auth/google`
* **Group APIs**

  * `GET /groups`
  * `POST /groups/create`
  * `PUT /groups/:id`
  * `DELETE /groups/:id`
* **Expense APIs**

  * `POST /expenses/add`
  * `GET /expenses/:groupId`
  * `PUT /expenses/:id`
  * `DELETE /expenses/:id`
* **Invite APIs**

  * `POST /invites/send`
  * `GET /invites`
  * `PUT /invites/:id/respond`

---

Let me know if you want a markdown version or an editable document template to start filling out.
