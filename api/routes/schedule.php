<?php
/**
 * Schedule route handlers
 */

function handle_get_schedule(): void {
    $db = getDB();
    $rows = $db->query("SELECT * FROM schedule ORDER BY FIELD(month,'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'), day ASC")->fetchAll();

    $events = array_map(function ($r) {
        return [
            'id'        => (int) $r['id'],
            'title'     => $r['title'],
            'venue'     => $r['venue'],
            'month'     => $r['month'],
            'day'       => (int) $r['day'],
            'dow'       => $r['dow'],
            'time'      => $r['time'],
            'status'    => $r['status'],
            'icon'      => $r['icon'],
            'doodle'    => $r['doodle'],
            'cardClass' => $r['card_class'],
        ];
    }, $rows);

    json_response($events);
}
