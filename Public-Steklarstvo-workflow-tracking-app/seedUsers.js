require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {});
    console.log('Povezava z MongoDB je vzpostavljena!');
  } catch (error) {
    console.error('Napaka pri povezavi z MongoDB:', error.message);
    process.exit(1);
  }
};

const seedUsers = async () => {
  await connectDB();

  try {
    await User.deleteMany({});

    // Branje iz .env
    const raw = process.env.USERS || '';
    const usersData = raw.split(',').map((item) => {
      const [username, password] = item.split(':');
      return { username, password };
    });

    for (const data of usersData) {
      const user = new User(data);
      await user.save();
    }

    console.log('Uporabniki so bili uspešno ustvarjeni.');
    process.exit(0);
  } catch (error) {
    console.error('Napaka pri ustvarjanju uporabnikov:', error);
    process.exit(1);
  }
};

seedUsers();
