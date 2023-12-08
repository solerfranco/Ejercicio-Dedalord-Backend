import { verify } from 'jsonwebtoken';

const secretKey = '$2b$10$tX2Xn8ihc3EiTXs8.IQvluPFRMN8VM823wcA4GsFKIBefb.FnHTNO';

const validateToken = (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    verify(token, secretKey, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        // Attach the decoded payload to the request object for further use
        req.user = decoded;

        next();
    });
};

export default {
  validateToken,
};
