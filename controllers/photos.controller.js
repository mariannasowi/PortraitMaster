const Photo = require('../models/photo.model');
const Voter = require('../models/Voter.model');
const sanitize = require('mongo-sanitize');

/****** SUBMIT PHOTO ********/

exports.add = async (req, res) => {
  try {
    const cleanFields = sanitize(req.fields);
    const { title, author, email } = cleanFields;
    const file = req.files.file;
    if(title && author && email && file) { // if fields are not empty...
      const fileName = file.path.split('/').slice(-1)[0]; // cut only filename from full path, e.g. C:/test/abc.jpg -> abc.jpg
      const fileExt = fileName.split('.').slice(-1)[0];
      const fileTypes = ['gif', 'jpg', 'png'];
      if(fileTypes.indexOf(fileExt) >= 0 && title.length <= 25 && author.length <= 50 && email.split('@').length === 2) {
        const newPhoto = new Photo({ title, author, email, src: fileName, votes: 0 });
        await newPhoto.save(); // ...save new photo in DB
        res.json(newPhoto);
      } else {
        throw new Error('Wrong input!');
      }
    } else {
      throw new Error('Wrong input!');
    }
  } catch(err) {
    res.status(500).json(err);
  }
};

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {
  try {
    res.json(await Photo.find());
  } catch(err) {
    res.status(500).json(err);
  }
};

/****** VOTE FOR PHOTO ********/

exports.vote = async (req, res) => {
  try {
    const photoToUpdate = await Photo.findOne({ _id: req.params.id });
    if(!photoToUpdate) res.status(404).json({ message: 'Not found' });
    else {
      const voter = await Voter.findOne({user: { $eq: req.ip} });
      if(!voter) {
        const newVoter = new Voter({
          user: req.ip,
          votes: [req.params.id],
        });
        await newVoter.save();
        photoToUpdate.votes++;
        photoToUpdate.save();
        res.send({ message: 'OK' });
      } else {
        if(voter.votes.indexOf(req.params.id) === -1) {
          voter.votes.push(req.params.id);
          await voter.save();
          photoToUpdate.votes++;
          photoToUpdate.save();
          res.send({ message: 'OK' });
        } else {
          throw new Error('User already voted!');
        }
      }
    }
  } catch(err) {
    res.status(500).json(err);
  }
};