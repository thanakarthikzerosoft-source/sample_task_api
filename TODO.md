# TODO: Switch from MySQL to MongoDB

## Completed Steps
- [x] Create .env with MONGO_URI=mongodb://localhost:27017/test
- [x] Create models/admin.js with schema for name, email, password
- [x] Create models/product.js with basic schema
- [x] Update app.js imports to use connectDB and Admin model
- [x] Update login route to use Admin.findOne instead of MySQL
- [x] Update register route to use Admin model for creation
- [x] Add connectDB call in app.listen

## Followup Steps
- [ ] Test MongoDB connection by running the server
- [ ] Verify login/register endpoints work with new models
- [ ] Remove mysql2 dependency if no longer needed
