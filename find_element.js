import fs from 'fs';
import { JSDOM } from 'jsdom';
import React from 'react';
import { renderToString } from 'react-dom/server';

// We can't easily render the whole app because of contexts and routing.
// But we can try to parse the TSX files using a regex or AST to find the structure.
