import * as Yup from 'yup';
import { isBefore, format } from 'date-fns';
import pt from 'date-fns/locale/pt';
import { Op } from 'sequelize';

import Mail from '../../lib/Mail';
import Attendance from '../models/Attendance';
import Meetup from '../models/Meetup';
import User from '../models/User';

class AttendanceController {
  async index(req, res) {
    const attendances = await Attendance.findAll({
      where: {
        user_id: req.userId,
      },
      include: [
        {
          model: Meetup,
          as: 'meetup',
          where: {
            date: {
              [Op.gte]: new Date(),
            },
          },
        },
      ],
    });

    return res.json(attendances);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      meetup_id: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation failed' });
    }

    const meetup = await Meetup.findByPk(req.body.meetup_id, {
      include: [
        {
          model: User,
          as: 'user',
        },
      ],
    });

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

    const insertAttendance = await Attendance.create({
      user_id: req.userId,
      meetup_id: meetup.id,
    });

    const attendance = await Attendance.findByPk(insertAttendance.id, {
      include: [
        {
          model: User,
          as: 'user',
        },
        {
          model: Meetup,
          as: 'meetup',
        },
      ],
    });

    await Mail.sendMail({
      to: `${meetup.user.name} <${meetup.user.email}>`,
      subject: 'Uma pessoa vai no teu evento',
      template: 'attendanceConfirmation',
      context: {
        author: meetup.user.name,
        user: attendance.user.name,
        name: meetup.name,
        date: format(meetup.date, "'dia' dd 'de' MMMM', às' H:mm'h'", {
          locale: pt,
        }),
      },
    });

    return res.json(attendance);
  }
}

export default new AttendanceController();
