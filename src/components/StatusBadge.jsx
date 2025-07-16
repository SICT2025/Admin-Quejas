import { Badge } from 'react-bootstrap';

const StatusBadge = ({ status }) => {
  let variant = 'secondary';
  if (status === 'Recibida') variant = 'warning';
  if (status === 'En proceso') variant = 'primary';
  if (status === 'Resuelta') variant = 'success';
  if (status === 'Rechazada') variant = 'danger';

  return <Badge bg={variant}>{status}</Badge>;
};

export default StatusBadge;