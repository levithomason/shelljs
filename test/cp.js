var shell = require('..');
var common = require('../src/common');

var assert = require('assert'),
    fs = require('fs'),
    numLines = require('./utils/utils').numLines;

shell.config.silent = true;

shell.rm('-rf', 'tmp');
shell.mkdir('tmp');

//
// Invalids
//

shell.cp();
assert.ok(shell.error());

shell.cp('file1');
assert.ok(shell.error());

shell.cp('-f');
assert.ok(shell.error());

shell.rm('-rf', 'tmp/*');
shell.cp('-@', 'resources/file1', 'tmp/file1'); // option not supported, files OK
assert.ok(shell.error());
assert.equal(fs.existsSync('tmp/file1'), false);

shell.cp('-Z', 'asdfasdf', 'tmp/file2'); // option not supported, files NOT OK
assert.ok(shell.error());
assert.equal(fs.existsSync('tmp/file2'), false);

shell.cp('asdfasdf', 'tmp'); // source does not exist
assert.ok(shell.error());
assert.equal(numLines(shell.error()), 1);
assert.equal(fs.existsSync('tmp/asdfasdf'), false);

shell.cp('asdfasdf1', 'asdfasdf2', 'tmp'); // sources do not exist
assert.ok(shell.error());
assert.equal(numLines(shell.error()), 2);
assert.equal(fs.existsSync('tmp/asdfasdf1'), false);
assert.equal(fs.existsSync('tmp/asdfasdf2'), false);

shell.cp('asdfasdf1', 'asdfasdf2', 'resources/file1'); // too many sources (dest is file)
assert.ok(shell.error());

shell.cp('-n', 'resources/file1', 'resources/file2'); // dest already exists
assert.ok(shell.error());

shell.cp('resources/file1', 'resources/file2', 'tmp/a_file'); // too many sources
assert.ok(shell.error());
assert.equal(fs.existsSync('tmp/a_file'), false);

//
// Valids
//

// -f by default
shell.cp('resources/file2', 'resources/copyfile2');
shell.cp('resources/file1', 'resources/file2'); // dest already exists
assert.ok(!shell.error());
assert.equal(shell.cat('resources/file1') + '', shell.cat('resources/file2') + ''); // after cp
shell.mv('resources/copyfile2', 'resources/file2'); // restore
assert.ok(!shell.error());

// -f (explicitly)
shell.cp('resources/file2', 'resources/copyfile2');
shell.cp('-f', 'resources/file1', 'resources/file2'); // dest already exists
assert.ok(!shell.error());
assert.equal(shell.cat('resources/file1') + '', shell.cat('resources/file2') + ''); // after cp
shell.mv('resources/copyfile2', 'resources/file2'); // restore
assert.ok(!shell.error());

// simple - to dir
shell.cp('resources/file1', 'tmp');
assert.equal(shell.error(), null);
assert.equal(fs.existsSync('tmp/file1'), true);

// simple - to file
shell.cp('resources/file2', 'tmp/file2');
assert.equal(shell.error(), null);
assert.equal(fs.existsSync('tmp/file2'), true);

// simple - file list
shell.rm('-rf', 'tmp/*');
shell.cp('resources/file1', 'resources/file2', 'tmp');
assert.equal(shell.error(), null);
assert.equal(fs.existsSync('tmp/file1'), true);
assert.equal(fs.existsSync('tmp/file2'), true);

// simple - file list, array syntax
shell.rm('-rf', 'tmp/*');
shell.cp(['resources/file1', 'resources/file2'], 'tmp');
assert.equal(shell.error(), null);
assert.equal(fs.existsSync('tmp/file1'), true);
assert.equal(fs.existsSync('tmp/file2'), true);

shell.cp('resources/file2', 'tmp/file3');
assert.equal(fs.existsSync('tmp/file3'), true);
shell.cp('-f', 'resources/file2', 'tmp/file3'); // file exists, but -f specified
assert.equal(shell.error(), null);
assert.equal(fs.existsSync('tmp/file3'), true);

// glob
shell.rm('-rf', 'tmp/*');
shell.cp('resources/file?', 'tmp');
assert.equal(shell.error(), null);
assert.ok(fs.existsSync('tmp/file1'));
assert.ok(fs.existsSync('tmp/file2'));
assert.ok(!fs.existsSync('tmp/file1.js'));
assert.ok(!fs.existsSync('tmp/file2.js'));
assert.ok(!fs.existsSync('tmp/file1.txt'));
assert.ok(!fs.existsSync('tmp/file2.txt'));

// wildcard
shell.rm('tmp/file1', 'tmp/file2');
shell.cp('resources/file*', 'tmp');
assert.equal(shell.error(), null);
assert.ok(fs.existsSync('tmp/file1'));
assert.ok(fs.existsSync('tmp/file2'));
assert.ok(fs.existsSync('tmp/file1.js'));
assert.ok(fs.existsSync('tmp/file2.js'));
assert.ok(fs.existsSync('tmp/file1.txt'));
assert.ok(fs.existsSync('tmp/file2.txt'));

// recursive, with regular files
shell.rm('-rf', 'tmp/*');
shell.cp('-R', 'resources/file1', 'resources/file2', 'tmp');
assert.equal(shell.error(), null);
assert.ok(fs.existsSync('tmp/file1'));
assert.ok(fs.existsSync('tmp/file2'));

// recursive, nothing exists
shell.rm('-rf', 'tmp/*');
shell.cp('-R', 'resources/cp', 'tmp');
assert.equal(shell.error(), null);
assert.equal(shell.ls('-R', 'resources/cp') + '', shell.ls('-R', 'tmp/cp') + '');

//recursive, nothing exists, source ends in '/' (see Github issue #15)
shell.rm('-rf', 'tmp/*');
shell.cp('-R', 'resources/cp/', 'tmp/');
assert.equal(shell.error(), null);
assert.equal(shell.ls('-R', 'resources/cp') + '', shell.ls('-R', 'tmp/cp') + '');

// recursive, globbing regular files with extension (see Github issue #376)
shell.rm('-rf', 'tmp/*');
shell.cp('-R', 'resources/file*.txt', 'tmp');
assert.equal(shell.error(), null);
assert.ok(fs.existsSync('tmp/file1.txt'));
assert.ok(fs.existsSync('tmp/file2.txt'));

// recursive, copying one regular file (also related to Github issue #376)
shell.rm('-rf', 'tmp/*');
shell.cp('-R', 'resources/file1.txt', 'tmp');
assert.equal(shell.error(), null);
assert.ok(fs.existsSync('tmp/file1.txt'));
assert.ok(!fs.statSync('tmp/file1.txt').isDirectory()); // don't let it be a dir

//recursive, everything exists, no force flag
shell.rm('-rf', 'tmp/*');
shell.cp('-R', 'resources/cp', 'tmp');
shell.cp('-R', 'resources/cp', 'tmp');
assert.equal(shell.error(), null); // crash test only

//recursive, everything exists, with force flag
shell.rm('-rf', 'tmp/*');
shell.cp('-R', 'resources/cp', 'tmp');
shell.ShellString('changing things around').to('tmp/cp/dir_a/z');
assert.notEqual(shell.cat('resources/cp/dir_a/z') + '', shell.cat('tmp/cp/dir_a/z') + ''); // before cp
shell.cp('-Rf', 'resources/cp', 'tmp');
assert.equal(shell.error(), null);
assert.equal(shell.cat('resources/cp/dir_a/z') + '', shell.cat('tmp/cp/dir_a/z') + ''); // after cp

//recursive, creates dest dir since it's only one level deep (see Github issue #44)
shell.rm('-rf', 'tmp/*');
shell.cp('-r', 'resources/issue44', 'tmp/dir2');
assert.equal(shell.error(), null);
assert.equal(shell.ls('-R', 'resources/issue44') + '', shell.ls('-R', 'tmp/dir2') + '');
assert.equal(shell.cat('resources/issue44/main.js') + '', shell.cat('tmp/dir2/main.js') + '');

//recursive, does *not* create dest dir since it's too deep (see Github issue #44)
shell.rm('-rf', 'tmp/*');
shell.cp('-r', 'resources/issue44', 'tmp/dir2/dir3');
assert.ok(shell.error());
assert.equal(fs.existsSync('tmp/dir2'), false);

//recursive, copies entire directory
shell.rm('-rf', 'tmp/*');
shell.cp('-r', 'resources/cp/dir_a', 'tmp/dest');
assert.equal(shell.error(), null);
assert.equal(fs.existsSync('tmp/dest/z'), true);

//recursive, with trailing slash, does the exact same
shell.rm('-rf', 'tmp/*');
shell.cp('-r', 'resources/cp/dir_a/', 'tmp/dest');
assert.equal(shell.error(), null);
assert.equal(fs.existsSync('tmp/dest/z'), true);

// On Windows, permission bits are quite different so skip those tests for now
if (common.platform !== 'win') {
    //preserve mode bits
    shell.rm('-rf', 'tmp/*');
    var execBit = parseInt('001', 8);
    assert.equal(fs.statSync('resources/cp-mode-bits/executable').mode & execBit, execBit);
    shell.cp('resources/cp-mode-bits/executable', 'tmp/executable');
    assert.equal(fs.statSync('resources/cp-mode-bits/executable').mode, fs.statSync('tmp/executable').mode);
}

// Make sure hidden files are copied recursively
shell.rm('-rf', 'tmp/');
shell.cp('-r', 'resources/ls/', 'tmp/');
assert.ok(!shell.error());
assert.ok(fs.existsSync('tmp/.hidden_file'));

// no-recursive will copy regular files only
shell.rm('-rf', 'tmp/');
shell.mkdir('tmp/');
shell.cp('resources/file1.txt', 'resources/ls/', 'tmp/');
assert.ok(shell.error());
assert.ok(!fs.existsSync('tmp/.hidden_file')); // doesn't copy dir contents
assert.ok(!fs.existsSync('tmp/ls')); // doesn't copy dir itself
assert.ok(fs.existsSync('tmp/file1.txt'));

// no-recursive will copy regular files only
shell.rm('-rf', 'tmp/');
shell.mkdir('tmp/');
shell.cp('resources/file1.txt', 'resources/file2.txt', 'resources/cp',
    'resources/ls/', 'tmp/');
assert.ok(shell.error());
assert.ok(!fs.existsSync('tmp/.hidden_file')); // doesn't copy dir contents
assert.ok(!fs.existsSync('tmp/ls')); // doesn't copy dir itself
assert.ok(!fs.existsSync('tmp/a')); // doesn't copy dir contents
assert.ok(!fs.existsSync('tmp/cp')); // doesn't copy dir itself
assert.ok(fs.existsSync('tmp/file1.txt'));
assert.ok(fs.existsSync('tmp/file2.txt'));

shell.exit(123);
