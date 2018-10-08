var flatpickr;
var userId;
var placeId;

window.onload = function (e) {
    liff.init(function (data) {
        userId = data.context.userId;
        $("#showReservedTimeButton").prop("disabled", false);
        $(function () {
            const config = {
                inline: true,
                locale: "ja",
                minDate: new Date(),
                onChange: function () {
                    $("#showAvailableTimeButton").prop("disabled", false);
                }
            }
            flatpickr = flatpickr('#flatpickr', config);
        });
    });
    placeId = _getPlaceIdFromRequest();
    _getPlaceName(placeId).then((data, textStatus, jqXHR) => {
        console.log('done', jqXHR.status);
        document.getElementById("placeName").innerText = data.name;
        document.getElementById("price").innerText = data.price;
    }).catch((jqXHR, textStatus, errorThrown) => {
        console.log('fail', jqXHR.status);
        window.alert('Error: ' + errorThrown);
    });
};

function showAvailableTime() {
    $("#reserveSelectedDateButton").prop("disabled", true);
    const selectedDate = _getSelectedDate();
    if (selectedDate == null) {
        return;
    }

    document.getElementById('availabilityModalTitle').innerText = document.getElementById("placeName").innerText + ' - ' + selectedDate.year + '年' + selectedDate.month + '月' + selectedDate.day + '日の空き状況';
    document.getElementById('availabilityModalBody').innerText = '取得しています...'; // Reset body html not to show previous data
    $("#availabilityModal").modal();

    $.ajax({
        type: 'GET',
        url: 'https://bashotori.herokuapp.com/places/' + placeId + '/availableTimes/' + _getFormattedSelectedDate(selectedDate),
        dataType: 'json'
    }).then((data, textStatus, jqXHR) => {
        console.log('done: ', jqXHR.status);
        if (data.availableTimes.length == 0) {
            modalBody = '予約可能な時間帯がありません。'
        } else {
            var modalBody = '<div class="btn-group btn-group-toggle btn-group-vertical btn-block" data-toggle="buttons" id="filterAvailableTime">';
            $.each(data.availableTimes, (i, v) => {
                modalBody += '<label class="btn btn-outline-secondary"> \
                <input type="radio" name="options" id="option' + i + '" autocomplete="off" value="' + v + '">' + v + '</label>'
            });
            modalBody += '</div>';
        }
        document.getElementById('availabilityModalBody').innerHTML = modalBody;
        $(function () {
            $('#filterAvailableTime input[type=radio]').change(function () {
                $("#reserveSelectedDateButton").prop("disabled", false);
            });
        })
    }).catch((jqXHR, textStatus, errorThrown) => {
        console.log('fail', jqXHR.status);
        window.alert('Error: ' + errorThrown);
    });
}

function confirmReservation() {
    $("#reserveConfirmationModal").modal();
}

function showReservedTime() {
    $("#cancelSelectedDateButton").prop("disabled", true);
    document.getElementById('reservedTimeModalTitle').innerText = `${document.getElementById("placeName").innerText}の予約内容`
    document.getElementById('reservedTimeModalBody').innerText = '取得しています...'; // Reset body html not to show previous data
    $("#reservedTimeModal").modal();

    $.ajax({
        type: 'GET',
        url: 'https://bashotori.herokuapp.com/users/' + userId + "/reservations",
        data: {
            placeId: placeId
        },
        dataType: 'json'
    }).then((data, textStatus, jqXHR) => {
        console.log('done: ', jqXHR.status);
        if (data.reservations.length == 0) {
            modalBody = `現在、予約はありません。`;
        } else {
            var modalBody = '<div class="btn-group btn-group-toggle btn-group-vertical btn-block" data-toggle="buttons" id="filterReservedTime">';
            // TODO: Sort by reserved time
            $.each(data.reservations, (i, v) => {
                const productInfo = v.productInfo;
                modalBody += `<label class="btn btn-outline-secondary"> \
                <input type="radio" name="options" id="option${i}" autocomplete="off" value="${v.reservationId}"> \
                ${productInfo.year}年${productInfo.month}月${productInfo.day}日 ${productInfo.time}</label>`
            });
            modalBody += '</div>';
        }
        document.getElementById('reservedTimeModalBody').innerHTML = modalBody;
        $(function () {
            $('#filterReservedTime input[type=radio]').change(function () {
                $("#cancelSelectedDateButton").prop("disabled", false);
            });
        })
    }).catch((jqXHR, textStatus, errorThrown) => {
        console.log('fail', jqXHR.status);
        window.alert('Error: ' + errorThrown);
    });
}

function confirmCancellation() {
    document.getElementById("selectedReservation").innerText = `${document.getElementById("placeName").innerText} ${$('#filterReservedTime input:radio:checked').parent('label').text()}`;
    $("#cancelConfirmationModal").modal();
}

function cancelReservation() {
    // TODO: Show "Cancellation in progress..." like message
    const reservationId = _getSelectedReservationId();
    $.ajax({
        type: 'DELETE',
        url: `https://bashotori.herokuapp.com/users/${userId}/reservations/${reservationId}`
    }).then((data, textStatus, jqXHR) => {
        $("#cancelCompletedModal").modal();
    }).catch((jqXHR, textStatus, errorThrown) => {
        console.log('fail', jqXHR.status);
        window.alert('Error: ' + errorThrown);
    });
}

function reserve() {
    // TODO: Show "Reservation in progress..." like message
    const selectedDate = _getSelectedDate();
    const time = _getSelectedAvailableTime();
    const data = {
        userId: userId,
        productInfo: {
            name: document.getElementById("placeName").innerText + ' ' + selectedDate.year + '/' + selectedDate.month + '/' + selectedDate.day + ' ' + time,
            price: document.getElementById("price").innerText,
            placeId: placeId,
            year: selectedDate.year,
            month: selectedDate.month,
            day: selectedDate.day,
            time: time
        }
    }
    $.ajax({
        type: 'POST',
        url: 'https://bashotori.herokuapp.com/reservations',
        contentType: 'application/json',
        scriptCharset: 'utf-8',
        data: JSON.stringify(data),
    }).then(function (data) {
        liff.openWindow({
            url: data.uri,
            external: false
        });
        // Do not call liff.closeWindow to avoid closing LINE Pay screen on iOS.
    }).catch(function (error) {
        window.alert('Error sending message: ' + error.message);
    });
}

function openOfficialSite() {
    liff.openWindow({
        url: 'https://echigot1.wixsite.com/btori-02',
        external: false
    });
}

function _getPlaceIdFromRequest() {
    var pairs = location.search.substring(1).split('&');
    for (let pair of pairs) {
        var kv = pair.split('=');
        if (kv[0] == 'placeId') {
            return kv[1]
        }
    }
    // TODO error
    return '';
}

function _getPlaceName(placeId) {
    return $.ajax({
        type: 'GET',
        url: 'https://bashotori.herokuapp.com/places/' + placeId,
        dataType: 'json',
    });
}

function _getSelectedDate() {
    if (flatpickr.selectedDates.length == 0) {
        return;
    }
    const selectedDate = flatpickr.selectedDates[0];
    return {
        year: selectedDate.getFullYear(),
        month: selectedDate.getMonth() + 1,
        day: selectedDate.getDate()
    }
}

function _getSelectedAvailableTime() {
    return $('#filterAvailableTime input:radio:checked').val();
}

function _getFormattedSelectedDate(selectedDate) {
    return selectedDate.year + ("0" + (selectedDate.month)).slice(-2) + ("0" + (selectedDate.day)).slice(-2);
}

function _getSelectedReservationId() {
    return $('#filterReservedTime input:radio:checked').val();
}