export const mapDBToModelUsers = ({
  name,
  position,
  username,
  role,
}) => ({
    name,
    position,
    username,
    role,
});

export const mapDBToModelBooks = ({
  created_at,
  institution,
  status,
  check_in,
  check_out,
  total_guest,
}) => ({
    createdAt: created_at,
    institution,
    status,
    checkIn: check_in,
    checkOut: check_out,
    totalGuest: total_guest,
})