import * as Yup from 'yup';
import { isBefore } from 'date-fns';

import Attendance from '../models/Attendance';
import Meetup from '../models/Meetup';

class AttendanceController {
  async store(req, res) {
    const schema = Yup.object().shape({
      meetup_id: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation failed' });
    }

    const meetup = await Meetup.findByPk(req.body.meetup_id);

    if (!meetup) {
      return res.status(400).json({ error: 'Meetup not found' });
    }

    if (meetup.user_id === req.userId) {
      return res
        .status(401)
        .json({ error: 'You are already attending your own meetup' });
    }

    if (isBefore(meetup.date, new Date())) {
      return res.status(401).json({ error: 'Past meetups are not permitted' });
    }

    const isAlreadyAttending = await Attendance.findAll({
      where: {
        user_id: req.userId,
        meetup_id: meetup.id,
      },
    });

    if (isAlreadyAttending.length) {
      return res
        .status(401)
        .json({ error: 'You are already attending the requested meetup' });
    }

    const isSameDate = await Attendance.findAll({
      where: {
        user_id: req.userId,
      },
      include: [
        {
          model: Meetup,
          as: 'meetup',
          where: {
            date: meetup.date,
          },
        },
      ],
    });

    if (isSameDate.length) {
      return res
        .status(401)
        .json({ error: 'You are already attending a meetup for that date' });
    }

    const attendance = await Attendance.create({
      user_id: req.userId,
      meetup_id: meetup.id,
    });

    return res.json(attendance);
  }
}

export default new AttendanceController();
