"use strict";

var require = patchRequire(require),
    fs = require( "fs" ),    
    basePath = fs.absolute( fs.workingDirectory ),
    testPath = basePath + "/test/html/",
    screenshotsPath = basePath + "/screenshots",
    phantomcss = require( basePath + "/node_modules/phantomcss/phantomcss" ); // casper magix
// if anyone knows how to fix this for casperjs, feel free to remove the hard coded lib path

var ignored = {
    // Don't remove "." and ".." as this will lead into an endless loop.
    // Add other directories or files inside the html folder that you wish to get ignored
        "." : true,
        ".." : true
    },
    changedFiles = [];

function screenshotAndCompare( relativePath ) {

    casper.test.begin("Testing" + relativePath, function() {

        console.log("Processing with path:", relativePath);

        phantomcss.update( {
            rebase: casper.cli.get( "rebase" ),
            casper: casper,

            libraryRoot: basePath + "/node_modules/phantomcss",
            screenshotRoot: basePath + "/screenshots" ,
            failedComparisonsRoot: basePath + "/screenshots/failed",

            addLabelToFailedImage: false
        });

        casper.start( testPath + relativePath ); // points to the html file
        casper.viewport( 1024, 768 );

        casper.then( screenShotBody );    

        casper.then( compareScreenShots );

        casper.run( function() {
            console.log("Finished running tests for", relativePath);
            casper.test.done();
        });

        function compareScreenShots() {
            phantomcss.compareSession();
        }

        function screenShotBody() {
            phantomcss.screenshot("body", relativePath); // name of screenshot
        }

    });
}


function testRecursive( path ) {
    var fileList = fs.list( testPath + path ),
        targetFile,
        targetPath,
        i;    

    for( i =0; i < fileList.length; i++ ) {
        targetFile = fileList[i];

        if ( !ignored[targetFile] ) {
            targetPath = path + targetFile;

            if ( fs.isDirectory( testPath + targetPath ) ) {
                testRecursive( targetPath + "/" );
            } else {
                console.log( "Queued:", targetPath);
                screenshotAndCompare( targetPath );
            }
        }
    }
}

function addToChangedFilesList( fileName ) {
    if ( fileName.length > 2 ) {
        changedFiles.push(fileName.substring(1, fileName.length - 1));
    }
    
}

function deleteScreenShot( filename ) {
    var target = screenshotsPath + "/" + filename ;

    console.log("deleting original screenshot for:", target);
    try {
        require("fs").remove(target + "_0.png");
        require("fs").remove(target + "_0.diff.png");        
    } catch (e) {}
    
}

// Empty test that exists so that the build doesn't fail if no files are compared
function runEmptyCasperTestHack() {
    casper.test.begin("empty test", function() {
        casper.start().then( function() {
            casper.test.assert(true,true);
        }).run( function() {
            casper.test.done();
        });
    });
}



var spawn = require("child_process").spawn,
    execFile = require("child_process").execFile,
    child = spawn("git", ["log", "-1"]);

child.stdout.on("data", function( data ) {

    (data.match( /\*[^\*]*\*/g ) || []).map( addToChangedFilesList );    
    changedFiles.map( deleteScreenShot );
    

    testRecursive("");
    runEmptyCasperTestHack();
});



