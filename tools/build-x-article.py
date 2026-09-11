#!/usr/bin/env python3
"""Build ARTICLE-X.txt from ARTICLE.txt.

X posts are plain text — there is no bold button. The way everyone does bold in
a post is Unicode Mathematical Sans-Serif Bold, which copy-pastes intact into X,
Telegram, Discord and Notion. This script applies it to the headline, the section
headings, the market-event keys and a list of key phrases, and adds rules,
bullets and arrows.

Caveat worth knowing before you paste: screen readers announce these glyphs
character by character or skip them, and X's search does not index them as the
plain words. That is the trade for bold in a post.

    python3 tools/build-x-article.py
"""
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Mathematical Sans-Serif Bold code-point blocks
UPPER, LOWER, DIGIT = 0x1D5D4, 0x1D5EE, 0x1D7EC


def bold(t):
    out = []
    for ch in t:
        if 'A' <= ch <= 'Z':
            out.append(chr(UPPER + ord(ch) - 65))
        elif 'a' <= ch <= 'z':
            out.append(chr(LOWER + ord(ch) - 97))
        elif '0' <= ch <= '9':
            out.append(chr(DIGIT + ord(ch) - 48))
        else:
            out.append(ch)
    return ''.join(out)


RULE = '━━━━━━━━━━━━━━━━━━━━'

HEADINGS = [
    'What you are watching',
    'Published science beneath the meme',
    'The market becomes their sensory world',
    'The third brain',
    'The chair',
    'Every thrust hits all three brains',
    'Buys make them go harder. Sells give him hope.',
    'The bodies listen to the brains',
    'No wallet. No orders. No fake agent. And no turn.',
    'The brains drift apart',
    'What is real — and what is designed',
    'The meme is the interface',
]

# phrases that carry the argument, bolded in place
PHRASES = [
    'He is not simply present at this. He is encoding it.',
    'That single change is the entire project.',
    'Sensation in, at full gain.',
    'Motor commands out, into nothing.',
    'They are not connected to anything.',
    'He doesn\'t get a turn.',
    'The cuck\'s on the right, in green.',
    'seated is the only pose his outputs can reach',
    'hope reaches 1.00',
    'Buys make him pound harder.',
    'Sells slow him down.',
    'The flies never touch the token. They only feel it.',
    'The experiment is the reaction itself.',
    'Three brains. One couple. One chair.',
    'and one of them feels all of it for nothing',
]


def is_list_item(ln):
    """Bare list lines carry no terminal period; the market-map lines do."""
    s = ln.strip()
    if not s or s.endswith(('.', ':', '?')):
        return False
    if '→' in s and s.split('→')[0].strip().isupper():
        return False
    return len(s) < 120


def main():
    src = open(os.path.join(ROOT, 'ARTICLE.txt')).read()
    lines = src.split('\n')
    out = []
    i = 0
    first = True

    while i < len(lines):
        ln = lines[i].rstrip()
        stripped = ln.strip()

        if first and stripped.startswith('$CUCKFLY:'):
            out.append(bold(stripped))
            first = False
            i += 1
            continue

        if stripped in HEADINGS:
            if out and out[-1] == '':
                out.pop()
            out += ['', RULE, bold(stripped), '']
            i += 1
            # the blank line the source keeps after a heading
            while i < len(lines) and not lines[i].strip():
                i += 1
            continue

        # a list block: introduced by a line ending in ':'
        if stripped.endswith(':') and '→' not in stripped:
            out.append(stripped)
            i += 1
            if i < len(lines) and not lines[i].strip():
                out.append('')
                i += 1
            block = []
            while i < len(lines) and is_list_item(lines[i]):
                block.append(lines[i].strip())
                i += 1
                if i < len(lines) and not lines[i].strip():
                    if i + 1 < len(lines) and is_list_item(lines[i + 1]):
                        i += 1
                    else:
                        break
            if len(block) >= 3:
                out += ['▸ ' + b for b in block]
            else:
                out += block
            continue

        # market-event lines: bold the key on the left of the arrow
        if '→' in stripped and stripped.split('→')[0].strip().isupper():
            key, rest = stripped.split('→', 1)
            out.append(bold(key.strip()) + ' → ' + rest.strip())
            i += 1
            continue

        out.append(ln)
        i += 1

    text = '\n'.join(out)

    for p in PHRASES:
        text = text.replace(p, bold(p))

    # tidy: never more than one blank line in a row
    text = re.sub(r'\n{3,}', '\n\n', text).strip() + '\n'

    path = os.path.join(ROOT, 'ARTICLE-X.txt')
    open(path, 'w').write(text)
    print('wrote %s (%d chars, %d words)' % (path, len(text), len(text.split())))


if __name__ == '__main__':
    main()
