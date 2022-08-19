const express = require("express");
const app = express();
app.use(express.static("public"));

const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/jokeDB");

const ejs = require("ejs");
app.set('view engine', 'ejs');

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

const _ = require('lodash');



// 'npm install -g nodemon'  for using nodemon


const jokeSchema = {
    title: String,
    content: String
};

const Joke = mongoose.model("Joke", jokeSchema);

const joke1 = new Joke({
    title: "Alexander the Great",
    content: "What do Alexander the Great and Winnie the Pooh have in common? Same middle name."
});
const joke2 = new Joke({
    title: "Son wasn't mine",
    content: "I was horrified when my wife told me that my six-year-old son wasn't actually mine. Apparently I need to pay more attention during school pick-up."
});

const allJokes = [joke1, joke2];

//creating custom list to store jokes
const listSchema = {
    name: String,
    items: [jokeSchema]
};

//creating 'List' collection
const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {

    //if list for the route is already present then that list to be displayed instead of defalut
    Joke.find({}, function (err, foundItems) {
        if (foundItems.length === 0) {
            Joke.insertMany(allJokes, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Successfully saved default items to DB.");
                }
            });
            res.redirect("/");
            // res.render('404');
        }
        else {
            res.render("home", {
                jokeType: "All",
                jokes: foundItems
            });
        }
    });

});

app.get('/contact', function (req, res) {
    // res.sendFile(__dirname + "/views/contact.html");
    res.render('contact');

});

app.get('/Favicon.ico', function (req, res) {
    // res.sendFile(__dirname + "/views/contact.html");
    res.sendFile(__dirname + "/public/favicon.svg");

});

app.get('/:customListName', function (req, res) {
    const customListName = _.capitalize(req.params.customListName);

    //finding the list if collection with the same name exists
    List.findOne({ name: customListName }, function (err, foundList) {
        console.log(customListName);
        // if (foundList != null && foundList.name == "Favicon.ico") {
        //     res.render('home', {
        //         jokeType: foundList.name,
        //         jokes: foundList.items

        //         //name and items are the property of the "List"
        //     });
        // }

        if (!err) {
            if (!foundList) {
                //if list already not present, create a new list 
                console.log("List not present");
                const list = new List({
                    name: customListName,
                    items: []
                });
                list.save();
                //instead of redirecting to the home page we can render the route in the else case
                res.redirect("/" + customListName);

                //i.e 
            }
            else {
                //if list already present then render the home page with that list (skipping the save to DB part)
                console.log("List found");
                console.log(foundList);

                res.render('home', {
                    jokeType: foundList.name,
                    jokes: foundList.items

                    //name and items are the property of the "List"
                });
            }
        }
    });

});

app.post("/", function (req, res) {
    const jokeTitle = req.body.jokeName;
    const jokeContent = req.body.jokeContent;

    const jokeRoute = req.body.jokeButton;
    console.log("😍", jokeTitle, " 😍", jokeContent, "😍 ", jokeRoute, "😍");
    //the page the post request came from(tapped through the value present in the button) [also the same name for the list of the same route]


    const joke = new Joke({
        title: jokeTitle,
        content: jokeContent
    });

    if (jokeRoute == "All") {
        console.log("Found All list");
        joke.save();
        //saving joke to the joke list
        res.redirect('/');
    } else {
        List.findOne({ name: jokeRoute }, function (err, foundList) {
            console.log("found List to push joke", foundList.name);
            foundList.items.push(joke);
            //in the foundlist among the other lists created by the list schema
            foundList.save();
            res.redirect("/" + jokeRoute);
        });
    }


    // res.redirect('/');
});

app.post("/delete", function (req, res) {
    const deletJokeId = req.body.jokeDelete;
    const listName = req.body.listName;
    console.log("😎", listName);
    // console.log(deletJokeId);

    if (listName == "All") {
        Joke.findByIdAndRemove(deletJokeId, function (err) {
            if (!err) {
                console.log("Item deleted", function () { });
            }
            res.redirect('/');
        });
    } else {
        List.findOneAndUpdate({ name: listName },
            { $pull: { items: { _id: deletJokeId } } }, function (err, foundList) {
                if (!err) {
                    res.redirect("/" + listName);
                }
            });
    }
});

app.post("/edit", function (req, res) {
    const editJokeId = req.body.jokeEdit;
    const listName = req.body.listName;

    console.log("😎😎", listName);

    const updatedJoke = new Joke({
        _id: editJokeId,
        title: req.body.editedJokeName,
        content: req.body.editedJokeContent,
    });
    console.log("-------", editJokeId);

    if (listName === "All") {
        Joke.findByIdAndUpdate({ _id: editJokeId }, updatedJoke, function (err) {
            if (!err) {
                console.log("Item edited", function () { });
            } else {
                console.log(err);
            }
            res.redirect("/");
        });
    } else {
        Joke.findOneAndUpdate(
            //From the Joke DB we are tying to find the list which have the below name
            { name: listName },
            //(How are we going to update the list)
            //from the list we are going to pull the items list
            //from the items list we are going to match against the id
            { $pull: { items: { _id: editJokeId } } },
            //since findOneAndUpdate is going to find a list and update that list[so named 'foundList]
            function (err, foundList) {
                if (!err) {
                    res.redirect("/" + listName)
                    console.log("Updated successfully");
                }
            }
        );
    }
});

app.listen(5000, function () {
    console.log("Server started on port 5000");
});