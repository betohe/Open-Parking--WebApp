'use strict';

// Use local.env.js for environment variables that grunt will set when the server starts locally.
// Use for your api keys, secrets, etc. This file should not be tracked by git.
//
// You will need to set these on the server you deploy to.

module.exports = {
  DOMAIN: 'http://localhost:9000',
  SESSION_SECRET: 'camarboard-secret',

  FACEBOOK_ID: '1041274819269014',
  FACEBOOK_SECRET: '76b38a2bdb56acfd27512dc8a8a987c0',

  TWITTER_ID: 'OcWkjs0VHTTm5tq8JgoJrOCqL',
  TWITTER_SECRET: '73S9JNIlnl3WzBGSeittxuwTUbzU5YbGfallCtxddYOm2TFiVE',

  GOOGLE_ID: '711553882268-1ddlfh93q3r4ltohtq0o6fcc5lidb2ot.apps.googleusercontent.com',
  GOOGLE_SECRET: 'pXTZLpheGOnAb0f082wKbiXU',
  
  // Control debug level for modules using visionmedia/debug
  DEBUG: ''
};
