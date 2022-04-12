
// Middleware to check if user is logged in 
function loggedIn(req, res, next) {

    if (req.user) {
        next();
    } else {
        res.redirect('/login');
    }
}; 

module.exports = loggedIn; 