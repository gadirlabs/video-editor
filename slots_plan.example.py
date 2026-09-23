"""The graphics plan for one video. Copy this beside project.json as slots_plan.py.

Every cue is anchored to a segment with st() and en(), never to a typed frame number.
A typed number is correct until the first re-cut and silently wrong after it, and there is
always a re-cut.

  st(k)  the output frame where the segment beginning at speech stretch k starts
  en(k)  where it ends
  LEAD   a few frames, so an insert begins just before the words it illustrates

`full=True` means the graphic takes the whole frame. Everything else sits over the shot.
graphics.py refuses a plan where two slots overlap or two full-frame inserts run back to
back, and reports how often each shape was used.
"""


def build(st, en, slot, LEAD):
    return [
        # Open on the speaker already talking, with a small corner title.
        # A full-screen title card reads as corporate.
        slot('01-title', 'CornerTitle', st(0) + 4, en(0) - 2,
             {'eyebrow': 'Series name', 'title': 'This episode'}),

        # Spans the 1 → 2 cut, so the join is never seen.
        slot('02-lower-third', 'LowerThird', st(1) + 8, st(2) + 52,
             {'name': 'Speaker Name', 'role': 'What they do · Where'}),

        # Three short labels beside the speaker. Icons carry the meaning; the words are short.
        slot('03-pills', 'IconPills', st(5) + 30, en(5) - 6,
             {'items': [{'text': 'Build', 'icon': 'Hammer', 'at': 4},
                        {'text': 'Fix', 'icon': 'Wrench', 'at': 22},
                        {'text': 'Deploy', 'icon': 'Rocket', 'at': 40}]}),

        # The load-bearing sentence, set on the frame with one word in italic accent.
        slot('04-keyline', 'FrameText', st(16) + 6, st(16) + 118,
             {'text': "You don't need to know how to code.", 'accent': 'code'}),

        # A main idea earns the whole frame. This one spans a cut.
        slot('05-devices', 'DeviceDuo', st(28) + 10, en(31) - 34,
             {'phoneAt': st(31) - (st(28) + 10) - LEAD, 'texture': 'dots'}, full=True),

        # A supporting list sits beside the speaker, not over them. Alternate the side
        # between uses so the gesture does not repeat.
        slot('06-inside', 'IconList', st(49) + 6, en(49) - 4,
             {'eyebrow': "What's inside", 'side': 'right',
              'items': [{'text': 'Accounts', 'icon': 'KeyRound', 'at': 10},
                        {'text': 'Private user data', 'icon': 'Lock', 'at': 28},
                        {'text': 'Bookings', 'icon': 'CalendarCheck', 'at': 48},
                        {'text': 'Payments', 'icon': 'CreditCard', 'at': 66}]}),

        # Steps reveal in time with the words that name them.
        slot('07-pipeline', 'FlowRow', st(58) - LEAD, en(58) - 8,
             {'eyebrow': 'How it works', 'texture': 'dots',
              'steps': [{'title': 'Generate', 'sub': 'A draft is written', 'icon': 'PenLine', 'at': 14},
                        {'title': 'Review', 'sub': 'A person checks it', 'icon': 'UserCheck', 'at': 62},
                        {'title': 'Publish', 'sub': 'It goes live', 'icon': 'Upload', 'at': 104}]},
             full=True),

        # Close with two boxes over the live shot: what is next, and the mark.
        slot('08-end', 'EndBoxes', st(104) + 2, en(104),
             {'eyebrow': 'Up next', 'next': 'The next episode'}),
    ]
