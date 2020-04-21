const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const knex = require('knex');
const download = require('download');


const db = knex({
  client: 'pg',
  connection: {
  	connectionString: process.env.DATABASE_URL,
  	ssl: true
}
});


const server = express();

server.use(bodyParser.json());
server.use(cors());

server.get('/', (req, resp) => {
	db.select()
	.table('admin')
	.then(data => resp.json(data))
	.catch(err => resp.json(err))
 });

server.post('/register', (req, resp) => {
	const { name, email, password } = req.body;

	const salt = bcrypt.genSaltSync(10);
	const hash = bcrypt.hashSync(password, salt);

	if (name && email && password)
	{	
		db('users')
		.returning('*')
		.insert({
			name : name,
			email: email,
			password: hash,
			joiningdate: new Date()
		})
		.then(user => {
			resp.json('Successfully registered user');
		})
		.catch(err => {
		resp.status(400).json('Error, unable to register');
	})
	}
	else{
		resp.status(400).json('Kindly fill the required fields for registration');
	}
});


server.post('/signin', (req, resp) => {
	const { email, password } = req.body;
	var userandurls = []

	if(email && password){
		db.select('email', 'password')
		.from('users')
		.where('email', '=', email)
		.then(entry => {
			const isValid=bcrypt.compareSync(password, entry[0].password);
			if(isValid){
				db.select('*').from('users')
				.where('email', '=', email)
				.then(user => {
					userandurls.push(user[0]);
				})
				.then(() => {
					db.select('*')
					.from('urls')
					.then(data => {
						userandurls.push(data);
						resp.json(userandurls);
					})
				})
				.catch(err => {
					resp.status(400).json('Unable to sign in')
				})

			}
			else{
				resp.status(400).json('Email or Password is incorrect')
			}
		})
		.catch(err => {
			resp.status(400).json('Email or Password is incorrect')
		})



	}
	else{
		resp.status(400).json('Kindly fill required fields')
	}
})

server.post('/admin_signin', (req, resp) => {
	const { email, password } = req.body;
	var adminandurls = []

	if(email && password){
		db.select('email', 'password')
		.from('admin')
		.where('email', '=', email)
		.then(entry => {
			const isValid=(password===entry[0].password);
			if(isValid){
				db.select('*').from('admin')
				.where('email', '=', email)
				.then(user => {
					adminandurls.push(user[0]);
				})
				.then(() => {
					db.select('*')
					.from('urls')
					.then(data => {
						adminandurls.push(data);
						resp.json(adminandurls);
					})
				})
				.catch(err => {
					resp.status(400).json('Unable to sign in')
				})
			}
			else{
				resp.status(400).json('Email or Password is incorrect')
			}
		})
		.catch(err => {
			resp.status(400).json('Email or Password is incorrect')
		})
	}
	else{
		resp.status(400).json('Kindly fill required fields')
	}
});


server.post('/download', (req, resp) => {
	const {filename, url} = req.body;

		download(url, 'files');
		resp.json(`Successfully downloaded ${filename} into your ${__dirname}\\files folder`);

})


server.post('/upload', (req, resp) => {
	const { filename, url } = req.body;

		db('urls')
		.insert({
			filename : filename,
			url: url
		})
		.then(() => {
			db.select('*')
			.from('urls')
			.then(data => {
				resp.json(data);
			})
			.catch(err => resp.json(400).json('Error, unable to upload'))
		})
		.catch(err => {
		resp.status(400).json('Error, unable to upload');
	})

});


server.delete('/delete/:id', (req,resp) => {
	const { id } =req.params;

	db('urls')
	.where('id', id)
	.del()
	.then(() => {
			db.select('*')
			.from('urls')
			.then(data => {
				resp.json(data)
			})
			.catch(err => resp.json(400).json('Error, unable to delete'))
		})
	.catch(err => resp.status(400).json('Error occured'));

})



server.listen(process.env.PORT || 3000, () => {
	console.log(`Server is working on ${process.env.PORT}`);
});