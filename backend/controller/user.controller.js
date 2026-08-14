const users = [
  { id: 1, name: 'Affan', email: 'affan@example.com' },
  { id: 2, name: 'Rahul', email: 'rahul@example.com' },
  { id: 3, name: 'Aman', email: 'aman@example.com' },
  { id: 4, name: 'Arjun', email: 'arjun@example.com' },
  { id: 5, name: 'Vikas', email: 'vikas@example.com' }
];

// Get all users
const getAllUsers = (req, res) => {
  res.status(200).json({
    success: true,
    count: users.length,
    users
  });
};

// Get user by ID
const getUserById = (req, res) => {
  const userId = parseInt(req.params.id);

  const user = users.find(u => u.id === userId);

  if (user) {
    res.status(200).json({
      success: true,
      user
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
};

export default {
  getAllUsers,
  getUserById
};