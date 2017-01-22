$('#domains_id').change(function() {
    $.get('Api/V1/' + this.value + '/prizeTypes.json', function(arrPrizeTypes)
    {
        var $prizeType = $('#prizetypes_id');
 
            $prizeType.find('option').remove().end();
 
            $.each(arrPrizeTypes, function(index, prizeType) {
                $prizeType.append('<option value="' + prizeType.id + '">' + prizeType.name + '</option>');
        });
    });
});
 
$(document).ready(function() {
    $(".domains_id option[value='0']").attr("disabled","disabled");
    $(".prizetypes_id option[value='0']").attr("disabled","disabled");
});
