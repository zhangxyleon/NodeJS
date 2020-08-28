const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
var authenticate = require('../authenticate');
const Favorites = require('../models/favorites');

const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());

favoriteRouter
	.route('/')
	.get(authenticate.verifyUser, (req, res, next) => {
		Favorites.find({})
			.populate('user')
			.populate('dishes')
			.then(
				(favorites) => {
					res.statusCode = 200;
					res.setHeader('Content-Type', 'application/json');
					res.json(favorites);
				},
				(err) => next(err)
			)
			.catch((err) => next(err));
	})
	.post(authenticate.verifyUser, (req, res, next) => {
		Favorites.findOne({ user: req.user._id })
			.then((favorite) => {
				if (favorite) {
					for (let i = 0; i < req.body.length; i++) {
						if (favorite.dishes.indexOf(req.body[i]._id) === -1) {
							favorite.dishes.push(req.body[i]._id);
						}
					}
					favorite.save().then(
						(favorite) => {
							Favorites.findById(favorite._id).then((favorite) => {
								res.statusCode = 200;
								res.setHeader('Content-Type', 'application/json');
								res.json(favorite);
							});
						},
						(err) => next(err)
					);
				} else {
					Favorites.create({ user: req.user._id, dishes: req.body }).then(
						(favorite) => {
							Favorites.findById(favorite._id).then((favorite) => {
								res.statusCode = 200;
								res.setHeader('Content-Type', 'application/json');
								res.json(favorite);
							});
						},
						(err) => next(err)
					);
				}
			})
			.catch((err) => {
				return next(err);
			});
	})
	.put(authenticate.verifyUser, (req, res, next) => {
		res.statusCode = 403;
		res.end('PUT operation not supported on /favorites/');
	})
	.delete(authenticate.verifyUser, (req, res, next) => {
		Favorites.remove({})
			.then(
				(resp) => {
					res.statusCode = 200;
					res.setHeader('Content-Type', 'application/json');
					res.json(resp);
				},
				(err) => next(err)
			)
			.catch((err) => next(err));
	});
favoriteRouter
	.route('/:dishId')
	.post(authenticate.verifyUser, (req, res, next) => {
		Favorites.findOne({ user: req.user._id })
			.then((favorite) => {
				if (favorite) {
					if (favorite.dishes.indexOf(req.params.dishId) < 0) {
						favorite.dishes.push(req.params.dishId);
						favorite.save().then(
							(favorite) => {
								Favorites.findById(favorite._id)
									.populate('user')
									.populate('dishes')
									.then((favorite) => {
										res.statusCode = 200;
										res.setHeader('Content-Type', 'application/json');
										res.json(favorite);
									});
							},
							(err) => next(err)
						);
					} else {
						res.end('This dish is already in the favorite lists');
					}
				} else {
					res.end('Please create your favorite first');
				}
			})
			.catch((err) => next(err));
	})
	.delete(authenticate.verifyUser, (req, res, next) => {
		Favorites.findOne({ user: req.user._id })
			.then((favorite) => {
				if (favorite) {
					if (favorite.dishes.indexOf(req.params.dishId) <0) {
                        console.log(favorite.dishes)
						err = new Error('Favorite' + req.params.dishId + ' not found');
						err.status = 404;
						return next(err);
					} else {
						favorite.dishes.pull(req.params.dishId);
						favorite.save().then(
							(favorite) => {
								Favorites.findById(favorite._id)
									.populate('user')
									.populate('dishes')
									.then((favorite) => {
										res.statusCode = 200;
										res.setHeader('Content-Type', 'application/json');
										res.json(favorite);
									});
							},
							(err) => next(err)
						);
					}
				} else {
                    res.end('Please create your favorite first');
				}
			})
			.catch((err) => next(err));
	});
module.exports = favoriteRouter