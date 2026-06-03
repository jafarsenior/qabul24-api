export function cleanDoc(doc) {
  if (!doc) return null;
  const value = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  delete value._id;
  return value;
}

export function toUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt,
  };
}
