const groupMemberType = (memberList, userId) => {
    for (let member of memberList) {
        if (member.id == userId) {
            return member.memberType;
        }
    }
}

export default groupMemberType;