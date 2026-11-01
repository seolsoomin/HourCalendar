package com.hour.chat;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

class FakeChatMapper implements ChatMapper {

    final List<RoomMessage> rows = new ArrayList<>();
    final Map<String, Long> lastRead = new HashMap<>();
    final Map<Long, String> nicknames = new HashMap<>();
    private long sequence = 0;

    private RoomMessage copy(RoomMessage m) {
        RoomMessage c = new RoomMessage();
        c.setMessageId(m.getMessageId());
        c.setRoomId(m.getRoomId());
        c.setUserId(m.getUserId());
        c.setNickname(m.getUserId() == null ? null : nicknames.get(m.getUserId()));
        c.setMsgType(m.getMsgType());
        c.setContent(m.getContent());
        c.setRefId(m.getRefId());
        c.setStartTime(m.getStartTime());
        c.setEndTime(m.getEndTime());
        c.setCreatedAt(m.getCreatedAt());
        return c;
    }

    private List<RoomMessage> inRoom(Long roomId) {
        return rows.stream().filter(r -> r.getRoomId().equals(roomId)).map(this::copy).toList();
    }

    @Override
    public int insert(RoomMessage m) {
        m.setMessageId(++sequence);
        m.setCreatedAt(LocalDateTime.of(2026, 10, 22, 10, 0));
        rows.add(copy(m));
        return 1;
    }

    @Override
    public RoomMessage findById(Long messageId) {
        return rows.stream().filter(r -> r.getMessageId().equals(messageId)).findFirst().map(this::copy).orElse(null);
    }

    @Override
    public List<RoomMessage> findLatest(Long roomId, int limit) {
        List<RoomMessage> list = new ArrayList<>(inRoom(roomId));
        Collections.reverse(list);
        return list.stream().limit(limit).toList();
    }

    @Override
    public List<RoomMessage> findBefore(Long roomId, Long beforeId, int limit) {
        List<RoomMessage> list = new ArrayList<>(inRoom(roomId).stream().filter(r -> r.getMessageId() < beforeId).toList());
        Collections.reverse(list);
        return list.stream().limit(limit).toList();
    }

    @Override
    public List<RoomMessage> findAfter(Long roomId, Long afterId, int limit) {
        return inRoom(roomId).stream().filter(r -> r.getMessageId() > afterId).limit(limit).toList();
    }

    @Override
    public int markRead(Long roomId, Long userId, Long messageId) {
        lastRead.put(roomId + ":" + userId, messageId);
        return 1;
    }

    @Override
    public int markReadToLatest(Long roomId, Long userId) {
        lastRead.put(roomId + ":" + userId, sequence);
        return 1;
    }
}
